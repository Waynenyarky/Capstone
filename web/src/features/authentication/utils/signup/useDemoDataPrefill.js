import { useCallback } from 'react'
import dayjs from 'dayjs'
import { findProvinceByName, findCityByName, findBarangayByName } from '@/shared/services/psgcService'

const DEMO_PASSWORD = 'TempPass123!'

function getDemoPrefill() {
  return {
    firstName: 'Mark Stephen',
    lastName: 'Diaz',
    middleName: 'Cabalsi',
    suffix: '',
    email: 'stephendiaz.syv@gmail.com',
    phoneNumber: '09957811767',
    password: DEMO_PASSWORD,
    confirmPassword: DEMO_PASSWORD,
    termsAndConditions: true,
    sex: 'male',
    maritalStatus: 'single',
    dateOfBirth: dayjs().subtract(30, 'year'),
    placeOfBirth: 'Manila',
    nationality: 'Filipino',
    highestEducationalAttainment: 'college',
    fatherName: 'José Dela Cruz',
    motherName: 'Maria Dela Cruz',
    distinctiveMark: '',
  }
}

async function resolveDemoAddress() {
  const province = await findProvinceByName('Pangasinan')
  if (!province) return null
  const city = await findCityByName('Alaminos City', province.code)
  if (!city) {
    return {
      streetAddress: '123 Rizal St',
      postalCode: '2404',
      province: province.code,
      provinceName: province.name,
      city: undefined,
      cityName: '',
      barangay: undefined,
      barangayName: '',
    }
  }
  const barangay = await findBarangayByName('Poblacion', city.code)
  return {
    streetAddress: '123 Rizal St',
    postalCode: '2404',
    province: province.code,
    provinceName: province.name,
    city: city.code,
    cityName: city.name,
    barangay: barangay?.code ?? '',
    barangayName: barangay?.name ?? '',
  }
}

function getInvalidPrefill() {
  return {
    firstName: 'A',
    lastName: '',
    middleName: '',
    suffix: '',
    email: 'not-an-email',
    phoneNumber: '12',
    password: 'weak',
    confirmPassword: 'different',
    termsAndConditions: false,
    sex: undefined,
    maritalStatus: undefined,
    dateOfBirth: dayjs().add(1, 'year'),
    placeOfBirth: '',
    nationality: '',
    highestEducationalAttainment: undefined,
    fatherName: '',
    motherName: '',
    distinctiveMark: '',
  }
}

/**
 * Handles dev tools prefill for signup form.
 */
export function useDemoDataPrefill(form, setPasswordValue, setCurrentStep) {
  const handleFillDemoData = useCallback(async () => {
    const values = getDemoPrefill()
    form.setFieldsValue(values)
    setPasswordValue(values.password)
    const address = await resolveDemoAddress()
    if (address) {
      form.setFieldsValue({ address })
    }
  }, [form, setPasswordValue])

  const handleFillInvalidData = useCallback(() => {
    const values = getInvalidPrefill()
    form.setFieldsValue(values)
    setPasswordValue(values.password)
    setCurrentStep(0)
  }, [form, setPasswordValue, setCurrentStep])

  return { handleFillDemoData, handleFillInvalidData }
}
