const normalizeCode = (value) => String(value ?? '').trim();

export const getTargetEntityCode = (payload = {}) => {
  const fromCreateDataFlow =
    payload?.createDataFlow?.targetEntity?.code ??
    payload?.createDataFlow?.targetEntityCode;

  if (fromCreateDataFlow !== undefined && fromCreateDataFlow !== null && fromCreateDataFlow !== '') {
    return normalizeCode(fromCreateDataFlow);
  }

  const topLevel = payload?.targetEntity?.code ?? payload?.targetEntityCode;
  return normalizeCode(topLevel);
};

export const withTargetEntityCode = (payload = {}) => {
  const code = getTargetEntityCode(payload);
  if (!code) return payload;

  return {
    ...payload,
    targetEntity: { code },
    targetEntityCode: code,
    createDataFlow: payload.createDataFlow
      ? {
          ...payload.createDataFlow,
          targetEntity: { code },
          targetEntityCode: code,
        }
      : payload.createDataFlow,
  };
};
