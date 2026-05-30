import { Form as AntdForm } from 'antd'

function AppForm(props) {
  return <AntdForm validateTrigger="onBlur" {...props} />
}

AppForm.useForm = AntdForm.useForm
AppForm.useWatch = AntdForm.useWatch
AppForm.Item = AntdForm.Item
AppForm.List = AntdForm.List
AppForm.Provider = AntdForm.Provider

export { AppForm as Form }
