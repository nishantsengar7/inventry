import { useState } from 'react';

export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (fieldValues = values) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field] || [];
      const value = fieldValues[field];
      
      for (const rule of rules) {
        const error = rule(value, fieldValues);
        if (error) {
          newErrors[field] = error;
          break; // stop at first error per field
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    const newValues = { ...values, [field]: value };
    setValues(newValues);
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ 
      ...prev, [field]: true 
    }));
    
    // Validate this field on blur
    const fieldErrors = {};
    const rules = validationRules[field] || [];
    
    for (const rule of rules) {
      const error = rule(values[field], values);
      if (error) {
        fieldErrors[field] = error;
        break;
      }
    }
    
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const setFieldError = (field, error) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setFieldError,
    setValues
  };
}
