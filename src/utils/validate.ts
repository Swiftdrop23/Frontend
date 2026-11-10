export const isEmail = (v: string): boolean => /^\S+@\S+\.\S+$/.test(v.trim());
export const isPhone = (v: string): boolean => /^0\d{9}$/.test(v.replace(/\s/g, ""));
export const isStrong = (v: string): boolean => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
