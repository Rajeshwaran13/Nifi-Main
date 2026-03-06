import { createContext, useContext, useState } from 'react';

const DnDContext = createContext([null, () => {}]);

export const DnDProvider = ({ children }) => {
  const [selectedProcessor, setSelectedProcessor] = useState(null);

  return (
    <DnDContext.Provider value={[selectedProcessor, setSelectedProcessor]}>
      {children}
    </DnDContext.Provider>
  );
};

export const useDnD = () => useContext(DnDContext);

export default DnDContext;
