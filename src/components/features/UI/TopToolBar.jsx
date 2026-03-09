const TopToolBar = () => {
  return (
    <div
      style={{
        height: 44,
        background: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
       
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: "#fff", fontWeight: 700 }}>trinity</span>
        <span style={{ color: "#ff4444", fontWeight: 900, marginLeft: 2, fontSize:30}}>
          IOTOPS
        </span>
        <span  style={{ color: "#fff", fontWeight: 700 }}>
          Provisioning and Administration System
        </span>
      </div>
      <span style={{ color: "#fff", fontWeight: 700 }} >Welcome Admin</span>
      
    </div>
  );
};

export default TopToolBar;
