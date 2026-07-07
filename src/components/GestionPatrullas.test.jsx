import { render, screen, fireEvent } from '@testing-library/react';
import { GestionPatrullas } from './GestionPatrullas';

jest.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  },
}));

const patrulleroDisponible = {
  id_patrullero: 1,
  placa: 'ABC-123',
  nombre_oficial: 'Juan Perez',
  activo: true,
  id_estado: 1,
  estado_disponibilidad: 'Disponible',
};

const propsBase = {
  tabActiva: 'nuevas',
  patrulleros: [patrulleroDisponible],
  alertaActual: null,
  pendingAsignaciones: {},
  asignaciones: {},
  onCancelarAsignaciones: () => {},
  onFinalizarAsignacion: () => {},
  onCargarRuta: () => {},
  onDerivar: () => {},
  onEnviarATabulacion: () => {},
};

test('no permite despachar una patrulla si no hay alerta seleccionada', () => {
  const onDespachar = jest.fn();
  render(
    <GestionPatrullas {...propsBase} alertaSeleccionada={null} onDespachar={onDespachar} />
  );

  const botonDespachar = screen.getByText(/despachar/i);
  expect(botonDespachar).toBeDisabled();

  fireEvent.click(botonDespachar);
  expect(onDespachar).not.toHaveBeenCalled();
});

test('permite despachar una patrulla disponible cuando hay alerta seleccionada', () => {
  const onDespachar = jest.fn();
  render(
    <GestionPatrullas {...propsBase} alertaSeleccionada={5} onDespachar={onDespachar} />
  );

  const botonDespachar = screen.getByText(/despachar/i);
  expect(botonDespachar).not.toBeDisabled();

  fireEvent.click(botonDespachar);
  expect(onDespachar).toHaveBeenCalledWith(1);
});
