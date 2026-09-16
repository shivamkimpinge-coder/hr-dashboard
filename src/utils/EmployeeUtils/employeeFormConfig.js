import { isValidPhoneNumber } from 'react-phone-number-input'

export const emptyForm = {
  name: '',
  email: '',
  phone: '',
  gender: 'Male',
  dob: '',
  department: 'Engineering',
  designation: '',
  workType: 'Full Time',
  reportingManager: '',
  salary: '',
  joiningDate: '',
  address: '',
  status: 'Active',
  role: 'Employee',
}

export const EMAIL_PATTERN = /\S+@\S+\.\S+/

export const formatSalary = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return `$${num.toLocaleString()}`
}

export const toDateInput = (value) => (value ? String(value).slice(0, 10) : '')

export const getEmployeeFields = ({ idPrefix = '', includePassword = false, canManageRole = false } = {}) => {
  const fields = [
    { name: 'name', label: 'Full Name', id: `${idPrefix}name`, rules: { required: 'Full name is required' } },
    {
      name: 'email',
      label: 'Email',
      id: `${idPrefix}email`,
      type: 'email',
      rules: {
        required: 'Email is required',
        pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
      },
    },
  ]

  if (includePassword) {
    fields.push({
      name: 'password',
      label: 'Password',
      id: `${idPrefix}password`,
      type: 'password',
      placeholder: 'Leave blank to keep current password',
      rules: {
        validate: (value) => !value || value.length >= 6 || 'Password must be at least 6 characters long',
      },
    })
  }

  fields.push(
    {
      name: 'phone',
      label: 'Phone Number',
      id: `${idPrefix}phone`,
      type: 'phone',
      rules: {
        required: 'Phone number is required',
        validate: (value) => (value ? isValidPhoneNumber(value) || 'Please enter a valid phone number' : true),
      },
    },
    {
      name: 'gender',
      label: 'Gender',
      id: `${idPrefix}gender`,
      type: 'select',
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
      ],
    },
    { name: 'dob', label: 'Date of Birth', id: `${idPrefix}dob`, type: 'date' },
    {
      name: 'department',
      label: 'Department',
      id: `${idPrefix}department`,
      type: 'select',
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'IT Support', label: 'IT Support' },
        { value: 'Quality Assurance', label: 'Quality Assurance' },
        { value: 'Product Management', label: 'Product Management' },
        { value: 'Design', label: 'Design' },
        { value: 'Human Resources', label: 'Human Resources' },
        { value: 'Sales', label: 'Sales' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Operations', label: 'Operations' },
        { value: 'Customer Support', label: 'Customer Support' },
        { value: 'Administration', label: 'Administration' },
      ],
    },
    { name: 'designation', label: 'Designation', id: `${idPrefix}designation`, rules: { required: 'Designation is required' } },
    {
      name: 'workType',
      label: 'Work Type',
      id: `${idPrefix}workType`,
      type: 'select',
      options: [
        { value: 'Full Time', label: 'Full Time' },
        { value: 'Part Time', label: 'Part Time' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Intern', label: 'Intern' },
      ],
    },

    {
      name: 'salary',
      label: 'Salary',
      id: `${idPrefix}salary`,
      type: 'number',
      min: '0',
      rules: {
        required: 'Salary is required',
        valueAsNumber: true,
        min: { value: 1, message: 'Salary must be greater than 0' },
      },
    },
    {
      name: 'joiningDate',
      label: 'Joining Date',
      id: `${idPrefix}joiningDate`,
      type: 'date',
      rules: { required: 'Joining date is required' },
    },
    {
      name: 'status',
      label: 'Status',
      id: `${idPrefix}status`,
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
    {
      name: 'address',
      label: 'Address',
      id: `${idPrefix}address`,
      type: 'textarea',
      rows: '3',
      wrapperClassName: 'form-field form-field-full',
      rules: { required: 'Address is required' },
    }
  )

  if (canManageRole) {
    fields.push({
      name: 'role',
      label: 'Role',
      id: `${idPrefix}role`,
      type: 'select',
      options: [
        { value: 'Employee', label: 'Employee' },
        { value: 'HR', label: 'HR' },
        { value: 'Admin', label: 'Admin' },
      ],
    })
  }

  return fields
}
