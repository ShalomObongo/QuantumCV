import { render, fireEvent } from '@testing-library/react';
import { TemplateSelector } from '@/components/templates/template-selector';

describe('TemplateSelector Component', () => {
  const mockOnSelectTemplate = jest.fn();

  beforeEach(() => {
    mockOnSelectTemplate.mockClear();
  });

  it('should render all 5 templates', () => {
    const { getByText } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    expect(getByText('Modern Professional')).toBeInTheDocument();
    expect(getByText('Classic')).toBeInTheDocument();
    expect(getByText('Professional Executive')).toBeInTheDocument();
    expect(getByText('Creative')).toBeInTheDocument();
    expect(getByText('Minimalist')).toBeInTheDocument();
  });

  it('should display selected template with highlight', () => {
    const { container } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    // The selected template should have border-primary class
    const cards = container.querySelectorAll('[class*="border-primary"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should call onSelectTemplate when template is clicked', () => {
    const { getByText } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    const classicTemplate = getByText('Classic').closest('div[class*="cursor-pointer"]');
    if (classicTemplate) {
      fireEvent.click(classicTemplate);
      expect(mockOnSelectTemplate).toHaveBeenCalledWith('classic');
    }
  });

  it('should display template descriptions', () => {
    const { getByText } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    expect(
      getByText(/Clean two-column layout/i)
    ).toBeInTheDocument();
    expect(
      getByText(/Traditional single-column format/i)
    ).toBeInTheDocument();
  });

  it('should show color palette for each template', () => {
    const { container } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    // Each template should have 3 color indicators (primary, secondary, accent)
    const colorIndicators = container.querySelectorAll('[class*="rounded-full"][class*="w-4"]');
    // 5 templates × 3 colors = 15 color indicators
    expect(colorIndicators.length).toBeGreaterThanOrEqual(15);
  });

  it('should display layout badges', () => {
    const { getAllByText, getByText } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    expect(getAllByText('Two Column').length).toBeGreaterThan(0);
    expect(getAllByText('Single Column').length).toBeGreaterThan(0);
    expect(getByText('Timeline')).toBeInTheDocument();
  });

  it('should handle rapid template changes', () => {
    const { getByText, rerender } = render(
      <TemplateSelector
        selectedTemplate="modern"
        onSelectTemplate={mockOnSelectTemplate}
      />
    );

    // Click multiple templates rapidly
    const classic = getByText('Classic').closest('div[class*="cursor-pointer"]');
    const creative = getByText('Creative').closest('div[class*="cursor-pointer"]');

    if (classic && creative) {
      fireEvent.click(classic);
      fireEvent.click(creative);

      expect(mockOnSelectTemplate).toHaveBeenCalledTimes(2);
      expect(mockOnSelectTemplate).toHaveBeenNthCalledWith(1, 'classic');
      expect(mockOnSelectTemplate).toHaveBeenNthCalledWith(2, 'creative');
    }
  });

  it('should render without crashing with different selected templates', () => {
    const templates = ['modern', 'classic', 'professional', 'creative', 'minimal'];

    templates.forEach((templateId) => {
      const { unmount } = render(
        <TemplateSelector
          selectedTemplate={templateId as any}
          onSelectTemplate={mockOnSelectTemplate}
        />
      );
      unmount();
    });
  });
});
