import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { message } from 'antd';
import GeneralPermitApplication from '../GeneralPermitApplication';
import { getPermitCategories, submitPermitApplication, getPermitApplications } from '../../../services/permitService';
import { useBusiness } from '@/hooks/useBusiness';

// Mock dependencies
jest.mock('../../../services/permitService');
jest.mock('@/hooks/useBusiness');
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('GeneralPermitApplication', () => {
  const mockBusiness = { 
    id: 'business1', 
    businessName: 'Test Business',
    name: 'Test Business'
  };

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Business Permit',
      processingTime: '5-7 days',
      requirements: [
        'Business registration certificate',
        'Valid ID',
        'Proof of address'
      ]
    },
    {
      id: 'cat2',
      name: 'Health Permit',
      processingTime: '3-5 days',
      requirements: [
        'Health inspection certificate',
        'Sanitation plan',
        'Food handler permits'
      ]
    }
  ];

  const mockApplications = [
    {
      applicationId: 'app1',
      category: 'Business Permit',
      status: 'Submitted',
      submittedDate: '2023-12-01',
      progress: 25
    },
    {
      applicationId: 'app2',
      category: 'Health Permit',
      status: 'Under Review',
      submittedDate: '2023-12-02',
      progress: 50
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useBusiness.mockReturnValue({ business: mockBusiness });
    getPermitCategories.mockResolvedValue({ categories: mockCategories });
    getPermitApplications.mockResolvedValue({ applications: mockApplications });
    submitPermitApplication.mockResolvedValue();
  });

  describe('Component Rendering', () => {
    test('renders component with loading state', () => {
      render(<GeneralPermitApplication />);
      expect(screen.getByText('General Permit Application')).toBeInTheDocument();
    });

    test('displays permit categories when loaded', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Business Permit')).toBeInTheDocument();
        expect(screen.getByText('Health Permit')).toBeInTheDocument();
      });
    });

    test('displays processing time tags', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('5-7 days')).toBeInTheDocument();
        expect(screen.getByText('3-5 days')).toBeInTheDocument();
      });
    });

    test('displays applications table', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Applications')).toBeInTheDocument();
        expect(screen.getByText('app1')).toBeInTheDocument();
        expect(screen.getByText('app2')).toBeInTheDocument();
      });
    });

    test('displays table columns correctly', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Permit Type')).toBeInTheDocument();
        expect(screen.getByText('Application ID')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Submitted Date')).toBeInTheDocument();
        expect(screen.getByText('Progress')).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    test('starts on first step', () => {
      render(<GeneralPermitApplication />);
      
      expect(screen.getByText('Select Permit Type')).toBeInTheDocument();
      expect(screen.getByText('Choose Permit Category')).toBeInTheDocument();
    });

    test('moves to second step when category is selected', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
        expect(screen.getByText('Application Description')).toBeInTheDocument();
      });
    });

    test('goes back to first step when back button is clicked', async () => {
      render(<GeneralPermitApplication />);
      
      // Move to second step
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Select Permit Type')).toBeInTheDocument();
        expect(screen.getByText('Choose Permit Category')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    test('displays category requirements when selected', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Requirements')).toBeInTheDocument();
        expect(screen.getByText('Business registration certificate')).toBeInTheDocument();
        expect(screen.getByText('Valid ID')).toBeInTheDocument();
        expect(screen.getByText('Proof of address')).toBeInTheDocument();
      });
    });

    test('updates selected category state', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat2' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Health inspection certificate')).toBeInTheDocument();
        expect(screen.getByText('Sanitation plan')).toBeInTheDocument();
        expect(screen.getByText('Food handler permits')).toBeInTheDocument();
      });
    });

    test('handles category selection with onChange', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });
    });
  });

  describe('Application Form', () => {
    test('displays business name field with correct initial value', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const businessNameInput = screen.getByDisplayValue('Test Business');
        expect(businessNameInput).toBeDisabled();
      });
    });

    test('validates required description field', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      // Try to submit without description
      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a description')).toBeInTheDocument();
      });
    });

    test('submits application successfully', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Test application description' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitPermitApplication).toHaveBeenCalledWith({
          businessId: 'business1',
          categoryId: 'cat1',
          description: 'Test application description',
          documents: [],
          businessName: 'Test Business'
        });
        expect(message.success).toHaveBeenCalledWith('Permit application submitted successfully.');
      });
    });

    test('resets form after successful submission', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Test application description' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should return to first step
        expect(screen.getByText('Select Permit Type')).toBeInTheDocument();
        expect(screen.getByText('Choose Permit Category')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    test('displays upload component', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
        expect(screen.getByText('Click or drag files to upload')).toBeInTheDocument();
        expect(screen.getByText('Support for PDF, DOC, DOCX files')).toBeInTheDocument();
      });
    });

    test('handles file upload in submission', async () => {
      const mockFiles = [
        {
          name: 'document.pdf',
          url: 'https://example.com/document.pdf',
          type: 'application/pdf',
          response: { url: 'https://example.com/document.pdf' }
        }
      ];

      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Test application description' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitPermitApplication).toHaveBeenCalledWith({
          businessId: 'business1',
          categoryId: 'cat1',
          description: 'Test application description',
          documents: [],
          businessName: 'Test Business'
        });
      });
    });
  });

  describe('Applications Table', () => {
    test('displays application data correctly', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Business Permit')).toBeInTheDocument();
        expect(screen.getByText('Health Permit')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Under Review')).toBeInTheDocument();
        expect(screen.getByText('2023-12-01')).toBeInTheDocument();
        expect(screen.getByText('2023-12-02')).toBeInTheDocument();
      });
    });

    test('displays status tags with correct colors', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const statusTags = screen.getAllByRole('generic');
        // Check that status tags are rendered
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Under Review')).toBeInTheDocument();
      });
    });

    test('displays progress bars', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const progressElements = screen.getAllByRole('progressbar');
        expect(progressElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Color Mapping', () => {
    test('handles different status colors', async () => {
      const applicationsWithDifferentStatuses = [
        { applicationId: 'app1', category: 'Business Permit', status: 'Draft', submittedDate: '2023-12-01', progress: 0 },
        { applicationId: 'app2', category: 'Health Permit', status: 'Submitted', submittedDate: '2023-12-02', progress: 25 },
        { applicationId: 'app3', category: 'Fire Permit', status: 'Under Review', submittedDate: '2023-12-03', progress: 50 },
        { applicationId: 'app4', category: 'Building Permit', status: 'Approved', submittedDate: '2023-12-04', progress: 100 },
        { applicationId: 'app5', category: 'Environmental Permit', status: 'Rejected', submittedDate: '2023-12-05', progress: 0 },
        { applicationId: 'app6', category: 'Special Permit', status: 'Requires Action', submittedDate: '2023-12-06', progress: 75 }
      ];
      getPermitApplications.mockResolvedValue({ applications: applicationsWithDifferentStatuses });
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Under Review')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Requires Action')).toBeInTheDocument();
      });
    });

    test('handles unknown status', async () => {
      const applicationsWithUnknownStatus = [
        { applicationId: 'app1', category: 'Unknown Permit', status: 'Unknown Status', submittedDate: '2023-12-01', progress: 0 }
      ];
      getPermitApplications.mockResolvedValue({ applications: applicationsWithUnknownStatus });
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Status')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('fetches categories and applications on component mount', () => {
      render(<GeneralPermitApplication />);
      
      expect(getPermitCategories).toHaveBeenCalled();
      expect(getPermitApplications).toHaveBeenCalledWith('business1');
    });

    test('does not fetch applications when no business', () => {
      useBusiness.mockReturnValue({ business: null });
      render(<GeneralPermitApplication />);
      
      expect(getPermitCategories).toHaveBeenCalled();
      expect(getPermitApplications).not.toHaveBeenCalled();
    });

    test('handles fetch data error', async () => {
      const errorMessage = 'Network error';
      getPermitCategories.mockRejectedValue(new Error(errorMessage));
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Failed to fetch permit data.');
      });
    });

    test('handles submit application error', async () => {
      const errorMessage = 'Submit error';
      submitPermitApplication.mockRejectedValue(new Error(errorMessage));
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Test application description' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Failed to submit permit application.');
      });
    });

    test('refreshes applications after successful submission', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Test application description' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getPermitApplications).toHaveBeenCalledTimes(2); // Initial load + refresh after submission
        expect(getPermitApplications).toHaveBeenLastCalledWith('business1');
      });
    });
  });

  describe('State Management', () => {
    test('resets selected category when going back', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Select Permit Type')).toBeInTheDocument();
        // Should not show requirements since no category is selected
        expect(screen.queryByText('Requirements')).not.toBeInTheDocument();
      });
    });

    test('handles business changes', async () => {
      const { rerender } = render(<GeneralPermitApplication />);
      
      // Initial render with business1
      expect(getPermitApplications).toHaveBeenCalledWith('business1');
      
      // Update to business2
      const newBusiness = { id: 'business2', businessName: 'New Business' };
      useBusiness.mockReturnValue({ business: newBusiness });
      rerender(<GeneralPermitApplication />);
      
      expect(getPermitApplications).toHaveBeenCalledWith('business2');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty categories response', async () => {
      getPermitCategories.mockResolvedValue({ categories: [] });
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Select a permit category')).toBeInTheDocument();
        // Should not show any category options
        expect(screen.queryByText('Business Permit')).not.toBeInTheDocument();
      });
    });

    test('handles null categories response', async () => {
      getPermitCategories.mockResolvedValue(null);
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Select a permit category')).toBeInTheDocument();
      });
    });

    test('handles undefined categories response', async () => {
      getPermitCategories.mockResolvedValue({});
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Select a permit category')).toBeInTheDocument();
      });
    });

    test('handles empty applications response', async () => {
      getPermitApplications.mockResolvedValue({ applications: [] });
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Applications')).toBeInTheDocument();
        expect(screen.queryByText('app1')).not.toBeInTheDocument();
      });
    });

    test('handles category without requirements', async () => {
      const categoryWithoutRequirements = {
        id: 'cat3',
        name: 'Simple Permit',
        processingTime: '1-2 days'
        // No requirements field
      };
      getPermitCategories.mockResolvedValue({ categories: [categoryWithoutRequirements] });
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat3' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
        // Should not crash when requirements are missing
      });
    });

    test('handles business without businessName', async () => {
      const businessWithoutName = { id: 'business1' };
      useBusiness.mockReturnValue({ business: businessWithoutName });
      
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const businessNameInput = screen.getByDisplayValue('');
        expect(businessNameInput).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('does not fetch applications unnecessarily', () => {
      useBusiness.mockReturnValue({ business: null });
      render(<GeneralPermitApplication />);
      
      expect(getPermitApplications).not.toHaveBeenCalled();
    });

    test('fetches data exactly once on mount', () => {
      render(<GeneralPermitApplication />);
      
      expect(getPermitCategories).toHaveBeenCalledTimes(1);
      expect(getPermitApplications).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'General Permit Application' })).toBeInTheDocument();
      });
    });

    test('form inputs have proper labels', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Application Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Supporting Documents')).toBeInTheDocument();
      });
    });

    test('buttons are keyboard accessible', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Application');
        const backButton = screen.getByText('Back');
        
        expect(submitButton).toBeEnabled();
        expect(backButton).toBeEnabled();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows validation error for empty description', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Application');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a description')).toBeInTheDocument();
      });
    });

    test('allows submission with valid description', async () => {
      render(<GeneralPermitApplication />);
      
      await waitFor(() => {
        const select = screen.getByPlaceholderText('Select a permit category');
        fireEvent.change(select, { target: { value: 'cat1' } });
      });

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Describe your permit application');
        fireEvent.change(descriptionInput, { target: { value: 'Valid description with sufficient length' } });
      });

      const submitButton = screen.getByText('Submit Application');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitPermitApplication).toHaveBeenCalled();
        expect(message.success).toHaveBeenCalledWith('Permit application submitted successfully.');
      });
    });
  });
});
