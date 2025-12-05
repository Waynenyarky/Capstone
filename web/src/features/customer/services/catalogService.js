import { fetchJsonWithFallback } from '@/lib/http.js'

export const CatalogEndpoints = Object.freeze({
  services: '/api/services',
  categories: '/api/categories',
  providers: '/api/providers',
  publicOfferings: '/api/provider-offerings/public',
})

/**
 * @returns {Promise<Array<{id:string,name:string,description?:string,status?:string,categoryId?:string,image?:any,pricingMode?:string,priceMin?:number|null,priceMax?:number|null,hourlyRateMin?:number|null,hourlyRateMax?:number|null}>>}
 */
export async function getServices(headers) {
  return await fetchJsonWithFallback(CatalogEndpoints.services, { headers })
}

/**
 * @returns {Promise<Array<{id:string,name:string}>>}
 */
export async function getCategories(headers) {
  return await fetchJsonWithFallback(CatalogEndpoints.categories, { headers })
}

/**
 * Fetch providers with status filter (public read)
 * @param {string} status
 * @returns {Promise<Array<{id:string,servicesCategories?:string[],serviceAreas?:string[],city?:string,province?:string,status?:string,applicationStatus?:string}>>}
 */
export async function getProvidersByStatus(status = 'approved', headers) {
  const url = `${CatalogEndpoints.providers}?status=${encodeURIComponent(status)}`
  return await fetchJsonWithFallback(url, { headers })
}

/**
 * Fetch publicly visible provider offerings for customers.
 * Optional params: { city?: string, province?: string, category?: string, search?: string }
 * @param {Object} params
 * @param {Record<string,string>} headers
 * @returns {Promise<Array<{id:string,serviceId:string,serviceName:string,categoryName?:string,providerId:string,providerName:string,providerCity?:string,providerProvince?:string,providerServiceAreas?:string[],pricingMode:string,fixedPrice?:number|null,hourlyRate?:number|null,availability?:Array,emergencyAvailable?:boolean,providerDescription?:string,active?:boolean,status?:string}>>}
 */
export async function getPublicOfferings(params = {}, headers) {
  const qs = new URLSearchParams()
  if (params.city) qs.set('city', params.city)
  if (params.province) qs.set('province', params.province)
  if (params.category) qs.set('category', params.category)
  if (params.search) qs.set('search', params.search)
  const url = `${CatalogEndpoints.publicOfferings}${qs.toString() ? `?${qs.toString()}` : ''}`
  return await fetchJsonWithFallback(url, { headers })
}