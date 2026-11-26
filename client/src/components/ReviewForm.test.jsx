import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ReviewForm } from './ReviewForm.jsx';
import { apiFetch } from '../api/client.js';

// No server: apiFetch is replaced by a fake one that remembers what it was given
vi.mock('../api/client.js', () => ({ apiFetch: vi.fn().mockResolvedValue({}) }));

describe('ReviewForm', () => {
  it('sends the rating, the comment and the criteria the visitor found', async () => {
    const onAdded = vi.fn();
    render(<ReviewForm placeId="p1" onAdded={onAdded} />);

    await userEvent.selectOptions(screen.getByLabelText('Rating'), '4');
    await userEvent.type(screen.getByLabelText('Comment'), 'Ramp at the door');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Step-free entrance' }));
    await userEvent.click(screen.getByRole('button', { name: 'Post review' }));

    expect(apiFetch).toHaveBeenCalledWith('/api/places/p1/reviews', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      rating: 4,
      comment: 'Ramp at the door',
      photoUrl: '',
      found: { stepFree: true, elevator: false, toilets: false, parking: false },
    });
    expect(onAdded).toHaveBeenCalled();
  });
});
