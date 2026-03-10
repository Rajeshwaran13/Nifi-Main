const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const walk = (value, path, out) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return;
    walk(value[0], path, out);
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, next]) => {
      walk(next, path ? `${path}.${key}` : key, out);
    });
    return;
  }

  if (!path) return;
  const label = path.split('.').pop();
  out.push({ id: path, path, label });
};

export default function extractSourceFields(sourceText) {
  if (!sourceText || !sourceText.trim()) return { fields: [], error: null };

  try {
    const parsed = JSON.parse(sourceText);
    const out = [];
    walk(parsed, '', out);
    return { fields: out, error: null };
  } catch (error) {
    return { fields: [], error };
  }
}

