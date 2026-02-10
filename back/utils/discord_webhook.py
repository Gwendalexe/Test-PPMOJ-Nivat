import os
from datetime import datetime
from discord_webhook import DiscordWebhook as DiscordWebhookLib, DiscordEmbed


class DiscordWebhook:
    """Utility class to send notifications to Discord via webhook."""

    def __init__(self):
        """Initialize Discord webhook with URL from environment variables."""
        self.webhook_url = os.getenv('DISCORD_WEBHOOK_URL')
        self.enabled = self.webhook_url is not None and self.webhook_url != ''
        self.env = os.getenv('ENV')

    def send_purchase_notification(
        self,
        username: str,
        formation_name: str,
        purchase_type: str,
        amount: int,
        user_id: int,
    ) -> bool:
        """
        Send a purchase notification to Discord.

        Args:
            username: The username of the buyer
            formation_name: Name of the formation/item purchased
            purchase_type: Type of purchase ('mojettes' or 'token_coin')
            amount: Amount paid/spent (mojettes or token coins)
            user_id: ID of the user
        Returns:
            True if notification was sent successfully, False otherwise
        """
        if not self.enabled:
            return False

        try:
            # Determine the color based on the env (green for prod, red for dev)
            color = "57F287" if self.env == 'prod' else "ED4245"

            # Create the webhook
            webhook = DiscordWebhookLib(url=self.webhook_url, rate_limit={"max_retries": 1})

            # Create the embed
            embed = DiscordEmbed(
                title="Nouvel achat" if self.env == 'prod' else "(DEV) Nouvel achat",
                description=f"Un utilisateur a acheté une formation : **{formation_name}**",
                color=color
            )

            embed.add_embed_field(
                name="User",
                value=f"{username} (ID: {user_id})",
                inline=True
            )

            embed.add_embed_field(
                name="Formation",
                value=formation_name,
                inline=True
            )

            embed.add_embed_field(
                name="Methode",
                value="Token Coins" if purchase_type == 'token_coin' else "Mojettes",
                inline=True
            )

            embed.add_embed_field(
                name="Prix",
                value=str(amount),
                inline=True
            )

            embed.add_embed_field(
                name="Date",
                value=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                inline=True
            )

            webhook.add_embed(embed)
            response = webhook.execute()

            return response is not None

        except Exception as e:
            print(f"Error sending Discord webhook notification: {str(e)}")
            return False


discord_webhook = DiscordWebhook()
