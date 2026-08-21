// Renders a list of field configs as a React Hook Form-registered form.
// Each field: { name, label, type, options (for select), rules, wrapperClassName, static, value, ...inputProps }
// Pass `register` and `errors` from useForm(); `rules` are React Hook Form validation rules.
// A field with `static: true` renders a plain read-only input (not registered) for display-only values.
function CommonForm({
  fields,
  register,
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
      ...rest
    } = field

    const inputId = field.id || name
    const fieldError = errors?.[name]
    const registerProps = !isStatic && register ? register(name, rules) : {}
    const invalidProps = fieldError ? { 'aria-invalid': 'true' } : {}

    let control
    if (isStatic) {
      control = <input id={inputId} type={type} value={staticValue ?? ''} readOnly {...rest} />
    } else if (type === 'select') {
      control = (
        <select id={inputId} {...registerProps} {...invalidProps} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    } else if (type === 'textarea') {
      control = <textarea id={inputId} {...registerProps} {...invalidProps} {...rest} />
    } else {
      control = <input id={inputId} type={type} {...registerProps} {...invalidProps} {...rest} />
    }

    return (
      <div className={wrapperClassName || fieldClassName} key={name}>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        {control}
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
