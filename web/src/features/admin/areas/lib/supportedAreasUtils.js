// Utilities for supported areas forms

export function buildExistingProvincesSet(areasByProvince) {
  const list = Array.isArray(areasByProvince) ? areasByProvince : []
  return new Set(list.map((grp) => String(grp?.province || '').trim().toLowerCase()))
}

export function buildActiveByProvinceMap(areasByProvince) {
  const list = Array.isArray(areasByProvince) ? areasByProvince : []
  return new Map(
    list.map((grp) => [
      String(grp?.province || '').trim().toLowerCase(),
      grp?.active !== false,
    ])
  )
}

export function normalizeAreaGroups(groups, activeByProvinceMap) {
  const list = Array.isArray(groups) ? groups : []
  return list.map((g) => ({
    province: String(g?.province || '').trim(),
    cities: Array.isArray(g?.cities) ? g.cities : [],
    active: activeByProvinceMap.get(String(g?.province || '').trim().toLowerCase()) ?? true,
  }))
}