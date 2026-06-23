export const rules = {
  required: (message = "This field is required") =>
    (value) => {
      if (value === undefined || value === null || String(value).trim() === "") {
        return message;
      }
      return null;
    },
  
  minLength: (min, message) =>
    (value) => {
      if (value && value.length < min) {
        return message || `Minimum ${min} characters required`;
      }
      return null;
    },
  
  maxLength: (max, message) =>
    (value) => {
      if (value && value.length > max) {
        return message || `Maximum ${max} characters allowed`;
      }
      return null;
    },
  
  email: (message = "Enter a valid email address") =>
    (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message;
      }
      return null;
    },
  
  positiveNumber: (message = "Must be a positive number") =>
    (value) => {
      if (value !== undefined && value !== "" && Number(value) <= 0) {
        return message;
      }
      return null;
    },
  
  minValue: (min, message) =>
    (value) => {
      if (value !== undefined && value !== "" && Number(value) < min) {
        return message || `Minimum value is ${min}`;
      }
      return null;
    },
  
  maxValue: (max, message) =>
    (value) => {
      if (value !== undefined && value !== "" && Number(value) > max) {
        return message || `Maximum value is ${max}`;
      }
      return null;
    },
  
  noSpaces: (message = "No spaces allowed") =>
    (value) => {
      if (value && /\s/.test(value)) {
        return message;
      }
      return null;
    },
  
  phone: (message = "Enter a valid phone number") =>
    (value) => {
      if (!value) return null; // optional
      const cleaned = value.replace(/[\s\-\(\)\+]/g, "");
      if (cleaned.length < 7) {
        return message;
      }
      if (!/^\d+$/.test(cleaned)) {
        return "Phone can only contain numbers";
      }
      return null;
    }
};
