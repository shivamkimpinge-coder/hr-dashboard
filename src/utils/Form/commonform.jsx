import { useState } from 'react'
import PhoneInput from 'react-phone-number-input/react-hook-form'
import 'react-phone-number-input/style.css'

function IconEye(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconEyeOff(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 2.5l15 15M8.2 8.35a2.5 2.5 0 0 0 3.45 3.45M6.1 6.15C3.6 7.4 1.5 10 1.5 10s3 6 8.5 6c1.5 0 2.75-.4 3.8-1M13.2 5.05C12.2 4.4 11.15 4 10 4c-.55 0-1.08.05-1.6.15M16.3 7.4A11 11 0 0 1 18.5 10s-.85 1.7-2.5 3.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PasswordField({ id, registerProps, invalidProps, rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field-wrap">
      <input id={id} type={visible ? 'text' : 'password'} {...registerProps} {...invalidProps} {...rest} />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
}

function CommonForm({
  fields,
  register,
  control,
  errors = {},
  onSubmit,
  formClassName = '',
  layoutClassName = '',
  fieldClassName = 'form-field',
  children,
}) {
  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      options,
      rules,
      wrapperClassName,
      static: isStatic,
      value: staticValue,
      showToggle,
      ...rest
    } = field

    const inputId = field.id || name
    const fieldError = errors?.[name]

    if (type === 'phone') {
      const { defaultCountry, placeholder, ...phoneRest } = rest
      return (
        <div className={wrapperClassName || fieldClassName} key={name}>
          {label ? <label htmlFor={inputId}>{label}</label> : null}
          <PhoneInput
            id={inputId}
            name={name}
            control={control}
            rules={rules}
            international
            countryCallingCodeEditable={false}
            defaultCountry={defaultCountry || 'US'}
            placeholder={placeholder}
            className={fieldError ? 'PhoneInput--invalid' : ''}
            {...phoneRest}
          />
          {fieldError ? <span className="field-error">{fieldError.message}</span> : null}
        </div>
      )
    }

    const registerProps = !isStatic && register ? register(name, rules) : {}
    const invalidProps = fieldError ? { 'aria-invalid': 'true' } : {}

    let fieldNode
    if (isStatic) {
      fieldNode = <input id={inputId} type={type} value={staticValue ?? ''} readOnly {...rest} />
    } else if (type === 'password' && showToggle) {
      fieldNode = <PasswordField id={inputId} registerProps={registerProps} invalidProps={invalidProps} rest={rest} />
    } else if (type === 'select') {
      fieldNode = (
        <select id={inputId} {...registerProps} {...invalidProps} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    } else if (type === 'textarea') {
      fieldNode = <textarea id={inputId} {...registerProps} {...invalidProps} {...rest} />
    } else {
      fieldNode = <input id={inputId} type={type} {...registerProps} {...invalidProps} {...rest} />
    }

    return (
      <div className={wrapperClassName || fieldClassName} key={name}>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        {fieldNode}
        {fieldError ? <span className="field-error">{fieldError.message}</span> : null}
      </div>
    )
  }

  const fieldElements = fields.map(renderField)

  return (
    <form className={formClassName} onSubmit={onSubmit} noValidate>
      {layoutClassName ? <div className={layoutClassName}>{fieldElements}</div> : fieldElements}
      {children}
    </form>
  )
}

export default CommonForm
