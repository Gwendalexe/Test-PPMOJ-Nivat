
import os

from flask import Flask, abort, g, json, jsonify, render_template, request
from flask_mail import Mail, Message


def send_email(to, subject, html_content):
    from app import app
    mail = Mail(app)
    if isinstance(to, str):  # Vérifiez si to est une chaîne de caractères
      to = [to]  # Convertissez-la en liste si ce n'est pas déjà le cas
    msg = Message(
        subject,
        recipients=to,
        html=html_content,
        sender=app.config["MAIL_DEFAULT_SENDER"],
    )
    mail.send(msg)


def sendConfirmationTemplate(email, user_id, token):
    front_url = os.getenv("FRONT_URL")
    confirmation_link = f"{front_url}/confirm_account/{user_id}/{token}"
    html_content = render_template(
        'ConfirmationAccount.html', confirmation_link=confirmation_link)
    subject = "Account Confirmation"
    send_email(email, subject, html_content)


def sendConfirmationPayment(email, user_id, token):
    front_url = os.getenv("FRONT_URL")
    confirmation_link = f"{front_url}/confirm_payment/{user_id}/{token}"
    html_content = render_template(
        'ConfirmationPayment.html', confirmation_link=confirmation_link)
    subject = "Payment Confirmation"
    send_email(email, subject, html_content)


def sendPasswordResetTemplate(email, token):
    front_url = os.getenv("FRONT_URL")
    confirmation_link = f"{front_url}/lostpassword/{token}"
    html_content = render_template(
        'ModificationPassword.html', confirmation_link=confirmation_link)
    subject = "Password Reset"
    send_email(email, subject, html_content)
