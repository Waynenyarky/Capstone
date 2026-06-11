export const loginEmailRules = [{
  validator: (_, value) => {
    if (value === undefined || value === null || value === '') {
      return Promise.reject(new Error('Please enter your email address'))
    }
    return Promise.resolve()
  }
}]
export const loginPasswordRules = [{
  validator: (_, value) => {
    if (value === undefined || value === null || value === '') {
      return Promise.reject(new Error('Please enter your password'))
    }
    return Promise.resolve()
  }
}]