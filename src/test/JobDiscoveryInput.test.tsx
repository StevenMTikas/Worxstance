import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchForm from '../features/01_job_discovery/SearchForm';

describe('JobDiscovery SearchForm', () => {
  it('renders input fields correctly', () => {
    render(<SearchForm onSearch={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/Target Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote Only/i)).toBeInTheDocument();
  });

  it('validates minimum length inputs', async () => {
    render(<SearchForm onSearch={vi.fn()} isLoading={false} />);
    
    const roleInput = screen.getByLabelText(/Target Role/i);
    const submitBtn = screen.getByText('Find Jobs').closest('button');

    fireEvent.change(roleInput, { target: { value: 'A' } }); // Too short
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(screen.getByText('Role must be at least 2 characters.')).toBeInTheDocument();
    });
  });

  it('submits valid data', async () => {
    const handleSearch = vi.fn();
    render(<SearchForm onSearch={handleSearch} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/Target Role/i), { target: { value: 'Product Manager' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Remote' } });
    fireEvent.click(screen.getByLabelText(/Remote Only/i)); // Check remote

    const submitBtn = screen.getByText('Find Jobs').closest('button');
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(handleSearch).toHaveBeenCalledWith(expect.objectContaining({
        role: 'Product Manager',
        location: 'Remote',
        isRemote: true
      }));
    });
  });

  it('shows loading state', () => {
    render(<SearchForm onSearch={vi.fn()} isLoading={true} />);
    const submitBtn = screen.getByRole('button');
    expect(submitBtn).toBeDisabled();
    // Check for spinner (implementation detail: empty span with specific classes usually)
    // Or just check text is gone
    expect(screen.queryByText('Find Jobs')).not.toBeInTheDocument();
  });
});

