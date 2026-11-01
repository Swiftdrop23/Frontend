export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
export const isPhone = (v) => /^0\d{9}$/.test(v.replace(/\s/g, ""));
export const isStrong = (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
