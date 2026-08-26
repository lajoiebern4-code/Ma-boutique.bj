export type TypeVehicule = 'moto' | 'voiture'

export type LivraisonEstimation = {
  adresse: string
  distanceKm: number
  dureeMinutes: number
  typeVehicule: TypeVehicule
  frais: number
}

