import {
  type TypeVehicule,
  type LivraisonEstimation,
} from '../types/livraison'

const ORIGINE = 'Cotonou, Bénin'

export function estimerLivraison(
  adresse: string,
  distanceKm: number,
  dureeMinutes: number,
  typeVehicule: TypeVehicule,
): LivraisonEstimation {
  return {
    adresse: adresse.trim(),
    distanceKm: Math.round(distanceKm * 10) / 10,
    dureeMinutes: Math.round(dureeMinutes),
    typeVehicule,
      frais: 0,
  }
}

export function obtenirOrigineLivraison() {
  return ORIGINE
}
