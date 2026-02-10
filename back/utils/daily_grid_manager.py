import datetime
import json
import os
import random
from typing import Dict, Optional

# Chemin vers le fichier de stockage des grilles du mois
DAILY_GRIDS_FILE = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), 'data', 'daily_grids.json')
# Assurez-vous que le dossier data existe
os.makedirs(os.path.dirname(DAILY_GRIDS_FILE), exist_ok=True)


class DailyGridManager:
    """Gestionnaire des grilles quotidiennes pour les Mojettes"""

    def __init__(self):
        self.ensure_file_exists()

    def ensure_file_exists(self) -> None:
        """S'assure que le fichier de stockage existe, le crée si nécessaire"""
        if not os.path.exists(DAILY_GRIDS_FILE):
            empty_data = {
                "current_month": "",
                "grids": {}
            }
            with open(DAILY_GRIDS_FILE, 'w') as f:
                json.dump(empty_data, f)

    def load_data(self) -> Dict:
        """Charge les données du fichier"""
        with open(DAILY_GRIDS_FILE, 'r') as f:
            return json.load(f)

    def save_data(self, data: Dict) -> None:
        """Sauvegarde les données dans le fichier"""
        with open(DAILY_GRIDS_FILE, 'w') as f:
            json.dump(data, f)

    def get_daily_grid_id(self, day: Optional[int] = None) -> int:
        """
        Récupère l'ID de la grille pour le jour spécifié ou le jour actuel

        Args:
            day: Jour du mois (1-31), si None, utilise le jour actuel

        Returns:
            L'ID de la grille pour le jour spécifié
        """
        today = datetime.date.today()
        requested_day = day if day is not None else today.day

        # Vérifier que le jour demandé n'est pas dans le futur
        if requested_day > today.day:
            return -1  # Jour futur non autorisé

        current_day = day if day is not None else today.day
        current_month = f"{today.year}-{today.month}"
        # current_day = "7"  # Pour les tests
        # current_month = "2025-05"  # Pour les tests

        data = self.load_data()

        # Vérifier si nous sommes dans un nouveau mois
        if data["current_month"] != current_month:
            # Générer de nouvelles grilles pour le mois
            self._generate_monthly_grids(current_month)
            data = self.load_data()  # Recharger les données

        # Récupérer l'ID de la grille pour le jour demandé
        day_str = str(current_day)
        if day_str not in data["grids"]:
            return -1  # Jour invalide

        return int(data["grids"][day_str])

    def _generate_monthly_grids(self, month: str) -> None:
        """
        Génère les grilles pour un mois entier

        Args:
            month: Mois au format "YYYY-MM"
        """
        from database.database import DatabaseManager

        db_manager = DatabaseManager()

        # Déterminer le nombre de jours dans le mois
        year, month_num = map(int, month.split('-'))
        last_day = 31  # Par défaut, maximum possible
        if month_num in [4, 6, 9, 11]:
            last_day = 30
        elif month_num == 2:
            # Vérifier si c'est une année bissextile
            if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
                last_day = 29
            else:
                last_day = 28

        # Récupérer des IDs de grilles aléatoires directement depuis la base de données
        # Nous en demandons last_day pour couvrir tous les jours du mois
        mojette_ids = db_manager.ReadRandomMojetteIds(last_day)

        if not mojette_ids:
            raise ValueError(
                "Aucune grille disponible pour générer les grilles du mois")

        # Assigner les grilles pour chaque jour du mois
        monthly_grids = {}
        for day in range(1, last_day + 1):
            # Chaque jour utilise une grille unique
            grid_id = mojette_ids[day-1]
            monthly_grids[str(day)] = grid_id

        # Sauvegarder les nouvelles données
        data = {
            "current_month": month,
            "grids": monthly_grids
        }
        self.save_data(data)
