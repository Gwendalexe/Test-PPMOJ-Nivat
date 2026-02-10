import os

import database.models as models
import stripe
from core.models import create_checkout_session_model
from database.database import DatabaseManager
from utils.common import load_environment
from flask import abort, redirect, request
from flask_caching import Cache
from flask_restx import Namespace, Resource, fields
from utils.decorators import token_required
from utils.token import decode_token

api = Namespace('payment', description='Payment related operations')

stripe_cache = Cache(config={'CACHE_TYPE': 'simple'})

db_manager = DatabaseManager()

env_state = load_environment()

stripe.api_key = os.getenv('STRIPE_PRIVATE_KEY')
front_url = os.getenv('FRONT_URL')
api_url = os.getenv('API_URL')


@api.route('/product')
class Products(Resource):
    @stripe_cache.cached(timeout=60 * 60 * 24)  # 1 day
    def get(self):
        '''List all products'''
        return list(stripe.Product.list(limit=100).auto_paging_iter())


@api.route('/product/<string:product_id>')
class Product(Resource):
    @stripe_cache.cached(timeout=60 * 60 * 24)  # 1 day
    def get(self, product_id):
        '''Get a product'''
        return stripe.Product.retrieve(product_id)


@api.route('/product/<string:product_id>/prices')
class ProductPrices(Resource):
    @stripe_cache.cached(timeout=60 * 60 * 24)  # 1 day
    def get(self, product_id):
        '''List all prices for a product'''
        return list(stripe.Price.list(product=product_id, limit=100).auto_paging_iter())


@api.route('/prices')
class Prices(Resource):
    @stripe_cache.cached(timeout=60 * 60 * 24)  # 1 day
    def get(self):
        '''List all prices'''
        return list(stripe.Price.list(limit=100).auto_paging_iter())


@api.route('/create-checkout-session', methods=['POST'])
class CreateCheckoutSession(Resource):
    @api.response(401, 'User token invalid')
    @api.expect(create_checkout_session_model, validate=True)
    @token_required
    def post(self):
        '''Create a checkout session'''
        user_id = decode_token(request.headers["Authorization"])['user_id']
        user = db_manager.ReadUserById(user_id)
        if user is None:
            return {'message': 'User not found'}, 404
        if user.confirmed is False:
            return {'message': 'User not confirmed'}, 400
        if user.stripe_id is None:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.username,
                metadata={'user_id': user_id},
            )
            user.stripe_id = customer.id
            db_manager.UpdateUser(
                user_id, {models.User.stripe_id: user.stripe_id})
        else:
            customer = stripe.Customer.retrieve(user.stripe_id)

        try:
            line_items = request.json.get('line_items')
            total_mojette = 0
            for item in line_items:
                item_stripe = stripe.Price.retrieve(
                    item['price'], expand=['product'])
                item['quantity'] = item['quantity'] * \
                    item_stripe.transform_quantity.divide_by
                if 'type' in item_stripe.product.metadata\
                        and item_stripe.product.metadata['type'] == 'token'\
                        and 'promo_mojette' in item_stripe.metadata\
                        and item_stripe.metadata['promo_mojette'] == 'true':
                    total_mojette += int(
                        item_stripe.metadata['promo_mojette_amount'])
            if (total_mojette > user.mojettes):
                return {'message': 'Not enough mojette'}, 400

            checkout_session = stripe.checkout.Session.create(
                line_items=line_items,
                customer=customer.id,
                invoice_creation={
                    'enabled': True,
                },
                automatic_tax={
                    'enabled': True,
                },
                customer_update={
                    'address': 'auto',
                },
                mode='payment',
                success_url=api_url + '/payment/success/{CHECKOUT_SESSION_ID}',
                cancel_url=api_url + '/payment/cancel/{CHECKOUT_SESSION_ID}',
                consent_collection={"terms_of_service": "required"},
                custom_text={
                    "terms_of_service_acceptance": {
                        "message": "je déclare avoir pris connaissance des conditions générales de vente « consultables en cliquant ici [(https://ppmoj.fr/conditions-generales-de-vente)](https://ppmoj.fr/conditions-generales-de-vente) » et les accepter sans réserve.",
                    },
                },
            )
            session = models.CheckoutSession(
                session_id=checkout_session.id,
                user_id=user_id,
                status='pending',
            )
            db_manager.createCheckoutSession(session)
        except Exception as e:
            stripe_cache.clear()
            return str(e)
        return {'id': checkout_session.id}


def handle_bought_item(session_id, user_id, item: stripe.LineItem):
    quantity = 1
    if item.quantity is not None:
        quantity = quantity * item.quantity
    product = stripe.Product.retrieve(item.price.product)
    if 'type' in product.metadata and product.metadata['type'] == 'token':
        if 'promo_mojette' in item.price.metadata\
                and item.price.metadata['promo_mojette'] == 'true'\
                and 'promo_mojette_amount' in item.price.metadata:
            promo_mojette_amount = int(
                item.price.metadata['promo_mojette_amount'])
            db_manager.payTokenPromoMojette(
                session_id, user_id, quantity, promo_mojette_amount)
        else:
            db_manager.payToken(session_id, user_id, quantity)
    elif 'type' in product.metadata and product.metadata['type'] == 'mojette':
        db_manager.payMojette(session_id, user_id, quantity)


@api.route('/success/<string:session_id>')
class Success(Resource):
    def get(self, session_id):
        '''Successfull payment'''
        if session_id is None:
            return redirect(front_url)
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        if checkout_session.payment_status == 'unpaid' or checkout_session.consent.terms_of_service != 'accepted':
            return redirect(front_url)
        session = db_manager.readCheckoutSession(session_id)
        if session is None or session.status != 'pending':
            return redirect(front_url)
        user_id = session.user_id
        items_bought = list(stripe.checkout.Session.list_line_items(
            session_id, limit=100).auto_paging_iter())
        for item in items_bought:
            handle_bought_item(session_id, user_id, item)
        return redirect(front_url + "?resetCart=true")


@api.route('/cancel/<string:session_id>')
class Cancel(Resource):
    def get(self, session_id):
        '''Payment canceled'''
        session = db_manager.readCheckoutSession(session_id)
        if session is None or session.status != 'pending':
            return redirect(front_url)
        db_manager.cancelCheckoutSession(session_id)
        stripe.checkout.Session.expire(session_id)

        return redirect(front_url + "/cart")
