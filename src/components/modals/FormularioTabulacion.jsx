import React, { useState, useEffect } from 'react';
import {  
  FaUser, FaFileAlt, FaMapMarkerAlt,  
  FaShieldAlt, FaBriefcase, FaTimes, FaHistory 
} from 'react-icons/fa';

const FormularioTabulacion = ({ isOpen, onClose, alerta, onConfirm }) => {
  const [tipoSeleccion, setTipoSeleccion] = useState(null);
  const [contravencionValue, setContravencionValue] = useState('');
  const [delitoValue, setDelitoValue] = useState('');

  useEffect(() => {
    setTipoSeleccion(null);
    setContravencionValue('');
    setDelitoValue('');
  }, [alerta?.id]);

  if (!isOpen) return null;

  const contravenciones = ["RP 01 RIÑAS Y PELEAS", "RP 02 ESTADO EBRIEDAD", "RP 03 AUX. PERS. HERIDA", "RP 04 ACTOS INMORALES", "RP 05 FALTAMIENTO A LA AUTORIDAD", "RP 06 NEGARCE A PAGAR", "RP 07 DAÑOS A PROP. PRIV.", "RP 08 RUIDOS MOLESTOS", "RP 09 OBSTRUCCION VIA PUBLICA", "RP 10 SUPLANTACION A LA AUTOR.", "RP 11 JUEGOS PROHIBIDOS", "RP 12 PROST. CLANDESTINA", "RP 13 DEFICIENTE MENTAL", "RP 14 CASO MATERNIDAD", "RP 15 PROBLEMA DE MENORES", "RP 16 PERSONA EXTRAVIADA", "RP 17 PERSONA SOSPECHOZA", "RP 18 PROBLEMA EXTRANJEROS", "RP 19 VEHICULO ABANDONADO", "RP 20 COOP. A OTROS ORGANISMOS", "RP 21 PORTAR ARMA DE FUEGO", "RP 22 EJECUCION DE MANDAMIENTO", "RP 23 VAGANCIA MALENTRETENIMI.", "RP 24 PROBLEMA DE CANES", "RP 25 MANIFESTACION", "RP 26 INUNDACION", "RP 27 DERRUMBE", "RP 28 DESLIZAMIENTO", "RP 29 PROBLEMA DE ELECTRICIDAD", "RP 30 SERV. VARIOS (CASOS)", "RP 31 PROBLEMAS FAMILIARES", "RP 32 CONTROL DE JUEGOS ELECTR.", "RP 33 REDADAS DE DROGADICTOS", "RP 34 CONTROL DE ESCOLARES", "RP 35 CONTROL INASISTENCIA", "RP 36 MENORES SE CUELGAN DE VL", "RP 37 DIRIGIR TRAFICO VEHICULAR", "RP 38 REDADAS DE ANTISOCIALES"];
  const delitos = ["DH 202 ROBO", "DH 203 ATRACO", "DH 204 LESIONES GRAVES", "DH 205 INTENTO DE VIOLACION", "DH 206 VIOLACION", "DH 207 INTENTO DE SUICIDIO", "DH 208 HOMICIDIO", "DH 209 ASESINATO", "DH 210 EXISTE CADAVER", "DH 211 FETO ENCONTRADO", "DH 212 RAPTO", "DH 213 SECUESTRO", "DH 214 TERRORISMO", "DH 215 FALSIFICACION DE MONEDA", "DH 216 CHEQUE EN DESCUBIERTO", "DH 217 HUELGA PARO", "DH 218 ABANDONO HOGAR", "DH 219 DIFAMACION Y CALUMNIA", "DH 220 AMENAZAS", "DH 221 ALLANAMIENTOA DOM.", "DH 222 ESTAFA", "DH 223 ABUSO DE CONFIANZA", "DH 224 ABIGEATO", "DH 225 CASO DE DROGAS", "DH 226 INCENDIO", "DH 227 HECHO DE TRANSITO", "DH 228 AGIO ESPECULACION", "DH 229 DISPARO ARMA DE FUEGO", "DH 230 GOLPES DE ESTADO", "DH 231 EXISTENSIA DE EXPLOSIVO", "DH 232 EXHIBICIONISMO", "DH 233 FUGA DE RECLUSOS", "DH 234 DESPOJO"];

  const handleContravencionChange = (e) => {
    const value = e.target.value;
    if (value) {
      setTipoSeleccion('contravencion');
      setContravencionValue(value);
      setDelitoValue('');
    } else {
      setTipoSeleccion(null);
      setContravencionValue('');
    }
  };

  const handleDelitoChange = (e) => {
    const value = e.target.value;
    if (value) {
      setTipoSeleccion('delito');
      setDelitoValue(value);
      setContravencionValue('');
    } else {
      setTipoSeleccion(null);
      setDelitoValue('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tipoSeleccion) {
      alert("Por favor seleccione una Contravención o un Delito.");
      return;
    }
    onConfirm(alerta?.id);
  };

  const cardStyle = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005] flex flex-col h-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white">
        
        {/* HEADER - reducido */}
        <div className="bg-[#1a5336] p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <FaShieldAlt size={14} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-wider">Tabulacion de alertas</h1>
          </div>
          <button type="button" onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <FaTimes size={18} />
          </button>
        </div>

        {/* CUERPO - reducido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/30">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. DATOS DE LA ALERTA */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaFileAlt className="text-blue-600 text-sm"/>} title="Datos de la Alerta" bgColor="bg-blue-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="col-span-2">
                  <Field label="Nombre del Ciudadano" value={alerta?.ciudadano} auto required />
                </div>
                <Field label="C.I." value="69326585 LP" auto required />
                <Field label="Número de Celular" value="70712345" auto required />
                <Field label="Categoría" value={alerta?.categoria || "No especificada"} auto required />
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 ml-2">Descripción Transcrita</label>
                  <textarea readOnly value={alerta?.incidente} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium italic text-slate-400 outline-none mt-1 h-20 resize-none" />
                </div>
              </div>
            </section>

            {/* 2. DIRECCIÓN Y DESCRIPCIÓN */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaMapMarkerAlt className="text-green-600 text-sm"/>} title="Dirección y Descripción" bgColor="bg-green-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <InputLabel label="Área Urbana" placeholder="Zona de área urbana" required />
                <InputLabel label="Área Rural" placeholder="Zona de área rural" required />
                <InputLabel label="Comuna" placeholder="Comuna" required />
                <InputLabel label="Distrito" placeholder="Distrito" required />
                <div className="col-span-2">
                  <InputLabel label="Subdistritos" placeholder="Subdistritos" required />
                </div>
                <Field label="Latitud" value={alerta?.lat || "-17.3935"} auto required />
                <Field label="Longitud" value={alerta?.lng || "-66.1570"} auto required />
              </div>
            </section>

            {/* 3. CLASIFICACIÓN DEL HECHO */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaShieldAlt className="text-red-500 text-sm"/>} title="Clasificación del Hecho" bgColor="bg-red-50" />
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                <SelectField 
                  label="Contravención (RP)" 
                  options={contravenciones} 
                  value={contravencionValue}
                  onChange={handleContravencionChange}
                  disabled={tipoSeleccion === 'delito'}
                />
                <SelectField 
                  label="Delitos (DH)" 
                  options={delitos} 
                  value={delitoValue}
                  onChange={handleDelitoChange}
                  disabled={tipoSeleccion === 'contravencion'}
                />
              </div>
            </section>

            {/* 4. INFORME POLICIAL */}
            <section className={`${cardStyle} !bg-amber-50/30 !border-amber-100`}>
              <HeaderSection icon={<FaShieldAlt className="text-amber-600 text-sm"/>} title="Informe Policial" bgColor="bg-amber-100" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <Field label="Unidad Asignada" value={alerta?.patrulla || "PAT-4"} auto required />
                <Field label="EPI" value="EPI CENTRAL" auto required />
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 ml-2">Reporte Patrullero</label>
                  <div className="mt-1 p-3 bg-white border border-amber-100 rounded-xl text-xs italic text-slate-400 shadow-inner h-24 overflow-y-auto">
                    "El caso fue atendido positivamente en el lugar del incidente..."
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 5. SECRETARIA */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.002]">
            <HeaderSection icon={<FaBriefcase className="text-purple-600 text-sm"/>} title="Tabulación para Secretaría" bgColor="bg-purple-50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <InputLabel label="Protagonistas" placeholder="Nombres..." required />
                <Field label="Remisión del Caso" value="Ministerio Público / Conciliación" auto required />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 ml-2 mb-1">Resumen Administrativo</label>
                <textarea required placeholder="Resumen administrativo obligatorio..." className="w-full bg-slate-50 border border-purple-100 rounded-xl p-3 text-xs font-medium text-slate-400 outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all shadow-sm flex-1 min-h-[100px]" />
              </div>
            </div>
          </section>

          {/* HISTORIAL */}
          <div className="pt-3 px-2">
            <h2 className="flex items-center gap-1.5 font-black text-slate-500 uppercase text-[9px] tracking-wider mb-5">
              <FaHistory className="text-[#1a5336] text-xs" /> Historial de proceso
            </h2>
            <div className="relative flex justify-between items-start max-w-4xl mx-auto">
              <div className="absolute top-2 left-0 w-full h-[1px] bg-slate-200 -z-10"></div>
              <HistoryItem role="Operador Receptor" name="Sof. 2do Juan Perez" />
              <HistoryItem role="Despachador" name="Sgto. Marina Lopez" />
              <HistoryItem role="Patrullero" name={alerta?.patrulla || "Unidad 4"} />
              <HistoryItem role="Tabulador" name="Damaris Antezana" highlight />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all">Descartar</button>
            <button type="submit" className="px-6 py-2.5 bg-[#1a5336] hover:bg-[#133d28] text-white font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all shadow">Finalizar Tabulación</button>
          </div>
        </div>
      </form>
    </div>
  );
};

const HeaderSection = ({ icon, title, bgColor }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h2>
  </div>
);

const InputLabel = ({ label, placeholder, required }) => (
  <div className="space-y-0.5">
    <label className="text-xs font-medium text-slate-500 ml-1.5">{label}</label>
    <input required={required} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
  </div>
);

const SelectField = ({ label, options, value, onChange, disabled }) => (
  <div className={`flex flex-col transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
    <label className="text-xs font-medium text-slate-500 ml-2 mb-1">{label}</label>
    <select 
      value={value}
      onChange={onChange}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none focus:ring-1 focus:ring-[#1a5336] transition-all"
    >
      <option value="">Seleccione...</option>
      {options.map((item, i) => <option key={i} value={item}>{item}</option>)}
    </select>
  </div>
);

const Field = ({ label, value, auto, required }) => (
  <div className="space-y-0.5">
    <label className="text-xs font-medium text-slate-500 ml-1.5 tracking-tight">{label}</label>
    <input required={required} type="text" readOnly={auto} defaultValue={value} className="w-full rounded-xl p-2.5 text-xs font-bold outline-none border bg-slate-100/40 border-slate-100 text-slate-500" />
  </div>
);

const HistoryItem = ({ role, name, highlight }) => (
  <div className="flex flex-col items-center bg-transparent z-10 px-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 mb-1 transition-all shadow-sm ${highlight ? 'bg-green-600 border-green-600 text-white scale-105' : 'bg-white border-slate-200 text-slate-400'}`}>
      <FaUser size={11} />
    </div>
    <div className="text-center bg-white px-1">
      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">{role}</p>
      <p className={`text-[9px] font-black uppercase ${highlight ? 'text-green-700' : 'text-slate-600'}`}>{name}</p>
    </div>
  </div>
);

export default FormularioTabulacion;