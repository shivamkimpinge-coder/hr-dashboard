export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const currentYear = new Date().getFullYear()

export const emptyStructureForm = {
  basicSalary: '',
  hra: '',
  allowance: '',
  bonus: '',
  pf: '',
  tax: '',
  deduction: '',
}

export const emptyGenerateForm = {
  employeeId: '',
  month: MONTHS[new Date().getMonth()],
  year: currentYear,
  basicSalary: '',
  hra: '',
  allowance: '',
  bonus: '',
  pf: '',
  tax: '',
  deduction: '',
}

export const formatCurrency = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const toNumber = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

export const computeNetSalary = ({ basicSalary, hra, allowance, bonus, pf, tax, deduction }) =>
  toNumber(basicSalary) +
  toNumber(hra) +
  toNumber(allowance) +
  toNumber(bonus) -
  toNumber(pf) -
  toNumber(tax) -
  toNumber(deduction)

export const getSalaryComponentFields = ({ idPrefix = '' } = {}) => [
  {
    name: 'basicSalary',
    label: 'Basic Salary',
    id: `${idPrefix}basicSalary`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: {
      required: 'Basic salary is required',
      valueAsNumber: true,
      min: { value: 1, message: 'Basic salary must be greater than 0' },
    },
  },
  {
    name: 'hra',
    label: 'HRA',
    id: `${idPrefix}hra`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'HRA cannot be negative' } },
  },
  {
    name: 'allowance',
    label: 'Allowance',
    id: `${idPrefix}allowance`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'Allowance cannot be negative' } },
  },
  {
    name: 'bonus',
    label: 'Bonus',
    id: `${idPrefix}bonus`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'Bonus cannot be negative' } },
  },
  {
    name: 'pf',
    label: 'PF',
    id: `${idPrefix}pf`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'PF cannot be negative' } },
  },
  {
    name: 'tax',
    label: 'Tax',
    id: `${idPrefix}tax`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'Tax cannot be negative' } },
  },
  {
    name: 'deduction',
    label: 'Deduction',
    id: `${idPrefix}deduction`,
    type: 'number',
    min: '0',
    step: '0.01',
    rules: { valueAsNumber: true, min: { value: 0, message: 'Deduction cannot be negative' } },
  },
]
