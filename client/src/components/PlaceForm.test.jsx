import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PlaceForm } from './PlaceForm.jsx';

describe('PlaceForm', () => {
  it('shows the four accessibility criteria', () => {
    render(<PlaceForm submitLabel="Add place" onSubmit={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Step-free entrance' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Elevator' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Accessible toilets' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Accessible parking' })).toBeInTheDocument();
  });

  it('sends the place with true / false for each criterion', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<PlaceForm submitLabel="Add place" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Cafe Younes');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'cafe');
    await userEvent.type(screen.getByLabelText('Address'), 'Hamra Street, Beirut');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Elevator' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add place' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Cafe Younes',
      category: 'cafe',
      address: 'Hamra Street, Beirut',
      stepFree: false,
      elevator: true,
      toilets: false,
      parking: false,
      photos: [],
      accessPhotos: {},
    });
  });

  it('shows the error from the API', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Address not found on the map'));
    render(<PlaceForm submitLabel="Add place" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Nowhere');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'shop');
    await userEvent.type(screen.getByLabelText('Address'), 'zzz');
    await userEvent.click(screen.getByRole('button', { name: 'Add place' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Address not found on the map');
  });
});
