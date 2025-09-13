import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar, 
  Users, 
  MapPin, 
  ChefHat, 
  Plus,
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { quoteFormSchema, type QuoteFormInput } from '../../lib/schemas';
import { formatCurrency, formatDate } from '../../lib/utils';
import { 
  calculatePricingBreakdown, 
  calculateSimplePricing,
  PricingCalculationError,
  type PricingCalculationInput
} from '../../lib/pricing';
import { 
  estimateDistanceFromTroy, 
  validateDeliveryAddress,
  calculateDistanceWithRadiusCheck 
} from '../../lib/geolocation';
import type { 
  EventType, 
  HungerLevel, 
  MenuSelection, 
  AddOnSelection,
  Product,
  CateringAddon,
  AdminSettings,
  PricingBreakdown
} from '../../types';

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

// API utility functions - CRITICAL FIX: Improved error handling
const fetchApi = async <T extends any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error (${response.status}): ${errorText || response.statusText}`
      };
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        error: 'Invalid response format'
      };
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

const loadAdminSettings = async (): Promise<AdminSettings | null> => {
  const response = await fetchApi<AdminSettings>('/api/admin/settings');
  return response.success ? response.data || null : null;
};

const loadCateringAddons = async (): Promise<CateringAddon[]> => {
  const response = await fetchApi<CateringAddon[]>('/api/catering/addons?active=true');
  return response.success ? response.data || [] : [];
};

// Mock product data - in production, this would come from MedusaJS
// Using realistic UUIDs for proper integration
const getMockProducts = (): { proteins: Product[], sides: Product[] } => {
  const proteins: Product[] = [
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d5e',
      title: 'Smoked Brisket',
      subtitle: 'Our signature cut',
      description: 'Slow-smoked for 14 hours with our secret rub',
      handle: 'smoked-brisket',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d5f',
        title: 'Per Person',
        prices: [{ id: 'price-1', amount: 1800, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d60',
      title: 'Pulled Pork',
      subtitle: 'Tender and juicy',
      description: 'Boston butt smoked low and slow',
      handle: 'pulled-pork',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d61',
        title: 'Per Person',
        prices: [{ id: 'price-2', amount: 1500, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d62',
      title: 'Smoked Chicken',
      subtitle: 'Crispy skin, tender meat',
      description: 'Half chickens rubbed and smoked to perfection',
      handle: 'smoked-chicken',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d63',
        title: 'Per Person',
        prices: [{ id: 'price-3', amount: 1400, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  const sides: Product[] = [
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d64',
      title: 'Mac & Cheese',
      subtitle: 'Creamy comfort food',
      description: 'Three-cheese blend with crispy breadcrumb topping',
      handle: 'mac-cheese',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d65',
        title: 'Per Person',
        prices: [{ id: 'side-price-1', amount: 600, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d66',
      title: 'Coleslaw',
      subtitle: 'Fresh and crispy',
      description: 'Traditional cabbage slaw with tangy dressing',
      handle: 'coleslaw',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d67',
        title: 'Per Person',
        prices: [{ id: 'side-price-2', amount: 400, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d68',
      title: 'Baked Beans',
      subtitle: 'Sweet and smoky',
      description: 'House-made beans with molasses and bacon',
      handle: 'baked-beans',
      thumbnail: '/api/placeholder/200/150',
      variants: [{
        id: '01924b2e-8f7a-7a3c-9d2e-8f1a2b3c4d69',
        title: 'Per Person',
        prices: [{ id: 'side-price-3', amount: 500, currency_code: 'usd' }]
      }],
      is_giftcard: false,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  return { proteins, sides };
};

type FormStep = 'event-details' | 'guest-count' | 'location' | 'menu-selection' | 'addons';

interface StepConfig {
  id: FormStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  {
    id: 'event-details',
    title: 'Event Details',
    subtitle: 'Tell us about your event',
    icon: Calendar
  },
  {
    id: 'guest-count',
    title: 'Guest Count',
    subtitle: 'How many people are you feeding?',
    icon: Users
  },
  {
    id: 'location',
    title: 'Location',
    subtitle: 'Where should we deliver?',
    icon: MapPin
  },
  {
    id: 'menu-selection',
    title: 'Menu Selection',
    subtitle: 'Choose your proteins and sides',
    icon: ChefHat
  },
  {
    id: 'addons',
    title: 'Add-ons',
    subtitle: 'Optional extras to enhance your event',
    icon: Plus
  }
];

const HUNGER_LEVELS = [
  { value: 'normal' as HungerLevel, label: 'Normal Appetite', description: 'Standard portions' },
  { value: 'prettyHungry' as HungerLevel, label: 'Pretty Hungry', description: '25% more food' },
  { value: 'reallyHungry' as HungerLevel, label: 'Really Hungry', description: '50% more food' }
];

const LOCAL_STORAGE_KEY = 'catering-quote-form';

export default function CateringQuoteWrapper() {
  const [currentStep, setCurrentStep] = useState<FormStep>('event-details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  
  // State declarations - CRITICAL FIX: Proper initialization with defaults
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [addons, setAddons] = useState<CateringAddon[]>([]);
  const [products, setProducts] = useState(() => getMockProducts());
  const [currentPricing, setCurrentPricing] = useState<PricingBreakdown | null>(null);
  const [pricingError, setPricingError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    trigger,
    reset
  } = useForm<QuoteFormInput>({
    resolver: zodResolver(quoteFormSchema),
    mode: 'onChange',
    defaultValues: {
      customerEmail: '',
      eventType: 'corporate',
      eventDate: '',
      guestCount: 25,
      hungerLevel: 'normal',
      address: '',
      menuSelections: [],
      addOns: []
    }
  });

  // Watch form values for persistence and calculations
  const formValues = watch();
  const menuSelections = watch('menuSelections') || [];
  const addOns = watch('addOns') || [];
  const guestCount = watch('guestCount') || 0;
  const hungerLevel = watch('hungerLevel') || 'normal';

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setLoadError('');
      
      try {
        // Load admin settings and addons in parallel
        const [settingsResult, addonsResult] = await Promise.all([
          loadAdminSettings(),
          loadCateringAddons()
        ]);
        
        if (!settingsResult) {
          throw new Error('Failed to load admin settings');
        }
        
        setAdminSettings(settingsResult);
        setAddons(addonsResult);
        
        // Load form data from localStorage after settings are loaded
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            Object.keys(parsedData).forEach(key => {
              setValue(key as keyof QuoteFormInput, parsedData[key]);
            });
          } catch (error) {
            console.error('Error loading saved form data:', error);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [setValue]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formValues));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formValues]);
  
  // Calculate pricing with real pricing engine - CRITICAL FIX: Moved before useEffect to prevent hoisting issues
  const calculateRealTimePricing = useCallback(() => {
    // Ensure adminSettings is loaded before any calculations
    if (!adminSettings || menuSelections.length === 0) {
      setCurrentPricing(null);
      setPricingError('');
      return;
    }
    
    const address = formValues.address;
    if (!address || address.trim().length < 5) {
      setCurrentPricing(null);
      setPricingError('');
      return;
    }
    
    try {
      // Calculate distance from address - with safety check for adminSettings
      if (!adminSettings.deliveryRadius) {
        setPricingError('Admin settings not properly loaded');
        setCurrentPricing(null);
        return;
      }
      
      const distanceResult = calculateDistanceWithRadiusCheck(address, adminSettings.deliveryRadius);
      
      if (!distanceResult.isWithinRadius) {
        setPricingError(`Address is outside delivery radius (${distanceResult.distanceMiles} miles away, max ${adminSettings.deliveryRadius} miles)`);
        setCurrentPricing(null);
        return;
      }
      
      // Prepare pricing calculation input
      const allProducts = [...products.proteins, ...products.sides];
      const pricingInput: PricingCalculationInput = {
        guestCount,
        hungerLevel,
        distanceMiles: distanceResult.distanceMiles,
        menuSelections,
        addOns,
        adminSettings,
        products: allProducts,
        cateringAddons: addons
      };
      
      // Calculate pricing using the real pricing engine
      const pricing = calculateSimplePricing(pricingInput);
      setCurrentPricing(pricing);
      setPricingError('');
      
    } catch (error) {
      console.error('Pricing calculation error:', error);
      
      if (error instanceof PricingCalculationError) {
        setPricingError(error.message);
      } else {
        setPricingError('Failed to calculate pricing');
      }
      
      setCurrentPricing(null);
    }
  }, [adminSettings, menuSelections, formValues.address, guestCount, hungerLevel, addOns, products, addons]);
  
  // Calculate pricing whenever relevant form values change - CRITICAL FIX: Moved after function declaration
  useEffect(() => {
    if (!adminSettings) {
      return; // Don't calculate pricing until adminSettings are loaded
    }
    
    const timeoutId = setTimeout(() => {
      calculateRealTimePricing();
    }, 1000); // Debounce pricing calculations
    
    return () => clearTimeout(timeoutId);
  }, [calculateRealTimePricing, adminSettings]);
  
  // Calculate estimated price (fallback for simple display)
  const calculateEstimatedPrice = () => {
    if (currentPricing) {
      return currentPricing.totalCents;
    }
    
    // Fallback calculation when real pricing isn't available
    let total = 0;
    
    menuSelections.forEach(selection => {
      const protein = products.proteins.find(p => p.id === selection.proteinId);
      const side = products.sides.find(s => s.id === selection.sideId);
      
      if (protein && side) {
        const proteinPrice = protein.variants[0]?.prices[0]?.amount || 0;
        const sidePrice = side.variants[0]?.prices[0]?.amount || 0;
        total += (proteinPrice + sidePrice) * selection.quantity;
      }
    });

    // Apply hunger level multiplier (default values)
    const multipliers = { normal: 1.0, prettyHungry: 1.25, reallyHungry: 1.5 };
    total *= multipliers[hungerLevel];

    // Add add-ons
    addOns.forEach(addon => {
      const addonItem = addons.find(a => a.id === addon.addOnId);
      if (addonItem) {
        total += addonItem.priceCents * addon.quantity;
      }
    });

    return Math.round(total);
  };

  const getCurrentStepIndex = () => STEPS.findIndex(step => step.id === currentStep);

  const canProceedToStep = async (targetStep: FormStep): Promise<boolean> => {
    const currentIndex = getCurrentStepIndex();
    const targetIndex = STEPS.findIndex(step => step.id === targetStep);
    
    if (targetIndex <= currentIndex) return true;

    // Validate each step sequentially
    for (let i = 0; i <= targetIndex; i++) {
      const stepId = STEPS[i].id;
      let fieldsToValidate: (keyof QuoteFormInput)[] = [];

      switch (stepId) {
        case 'event-details':
          fieldsToValidate = ['customerEmail', 'eventType', 'eventDate'];
          break;
        case 'guest-count':
          fieldsToValidate = ['guestCount', 'hungerLevel'];
          break;
        case 'location':
          fieldsToValidate = ['address'];
          break;
        case 'menu-selection':
          fieldsToValidate = ['menuSelections'];
          break;
        case 'addons':
          // Add-ons are optional, no validation needed
          break;
      }

      if (fieldsToValidate.length > 0) {
        const isStepValid = await trigger(fieldsToValidate);
        if (!isStepValid) return false;
      }
    }

    return true;
  };

  const handleStepChange = async (targetStep: FormStep) => {
    const canProceed = await canProceedToStep(targetStep);
    if (canProceed) {
      setCurrentStep(targetStep);
    }
  };

  const handleNext = async () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1].id;
      await handleStepChange(nextStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const previousStep = STEPS[currentIndex - 1].id;
      setCurrentStep(previousStep);
    }
  };

  const addMenuSelection = () => {
    const currentSelections = getValues('menuSelections') || [];
    setValue('menuSelections', [
      ...currentSelections,
      { proteinId: '', sideId: '', quantity: 1 }
    ]);
  };

  const removeMenuSelection = (index: number) => {
    const currentSelections = getValues('menuSelections') || [];
    setValue('menuSelections', currentSelections.filter((_, i) => i !== index));
  };

  const updateMenuSelection = (index: number, updates: Partial<MenuSelection>) => {
    const currentSelections = getValues('menuSelections') || [];
    const updatedSelections = [...currentSelections];
    updatedSelections[index] = { ...updatedSelections[index], ...updates };
    setValue('menuSelections', updatedSelections);
  };

  const toggleAddon = (addonId: string) => {
    const currentAddons = getValues('addOns') || [];
    const existingIndex = currentAddons.findIndex(addon => addon.addOnId === addonId);
    
    if (existingIndex >= 0) {
      // Remove addon
      setValue('addOns', currentAddons.filter((_, i) => i !== existingIndex));
    } else {
      // Add addon
      setValue('addOns', [...currentAddons, { addOnId, quantity: 1 }]);
    }
  };

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    const currentAddons = getValues('addOns') || [];
    const updatedAddons = currentAddons.map(addon =>
      addon.addOnId === addonId ? { ...addon, quantity } : addon
    );
    setValue('addOns', updatedAddons);
  };

  const onSubmit = async (data: QuoteFormInput) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      // Validate that we have all required data
      if (!adminSettings) {
        throw new Error('Admin settings not loaded');
      }
      
      if (!currentPricing) {
        throw new Error('Pricing calculation failed. Please check your selections.');
      }
      
      // Calculate final distance with safety check
      if (!adminSettings.deliveryRadius) {
        throw new Error('Admin settings not properly configured');
      }
      
      const distanceResult = validateDeliveryAddress(data.address, adminSettings.deliveryRadius);
      if (!distanceResult.isValid) {
        throw new Error(distanceResult.error || 'Invalid delivery address');
      }
      
      // Transform form data to API format
      const quoteData = {
        customerEmail: data.customerEmail,
        eventDetails: {
          type: data.eventType,
          date: data.eventDate,
          guestCount: data.guestCount,
          hungerLevel: data.hungerLevel,
          location: {
            address: data.address,
            distanceMiles: distanceResult.distance
          }
        },
        menuSelections: data.menuSelections,
        addOns: data.addOns,
        pricing: currentPricing,
        status: 'pending' as const
      };
      
      console.log('Submitting quote:', quoteData);
      
      // Submit to API
      const response = await fetchApi<{ id: string }>('/api/catering/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit quote');
      }
      
      console.log('Quote submitted successfully:', response.data);
      
      // Clear localStorage on successful submission
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      
      setSubmitStatus('success');
      reset();
      setCurrentStep('event-details');
      setCurrentPricing(null);
      setPricingError('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Quote form error:', error);
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // Reset error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitError('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepConfig = STEPS.find(step => step.id === currentStep)!;
  const currentStepIndex = getCurrentStepIndex();
  const estimatedPrice = calculateEstimatedPrice();
  
  // Show loading state during initial data fetch
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading catering options...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if data loading failed
  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-4 text-red-600">
          <AlertCircle className="h-8 w-8" />
          <div>
            <p className="text-lg font-medium">Failed to load catering options</p>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Get Your Catering Quote
        </h1>
        <p className="text-xl text-gray-600">
          Let's plan the perfect BBQ experience for your event
        </p>
      </div>

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Quote Submitted Successfully!</h3>
            <p className="text-green-700">
              We've received your catering request and will send you a detailed quote within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Submission Failed</h3>
            <p className="text-red-700">
              {submitError || 'Please try again or contact us directly for assistance.'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const IconComponent = step.icon;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  disabled={!isActive && !isCompleted}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-white text-primary'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.subtitle}</div>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className="w-12 h-px bg-gray-300 mx-2"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Event Details Step */}
            {currentStep === 'event-details' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerEmail">Contact Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('customerEmail')}
                      className={errors.customerEmail ? 'border-red-500' : ''}
                    />
                    {errors.customerEmail && (
                      <p className="text-sm text-red-600 mt-1">{errors.customerEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="eventType">Event Type *</Label>
                    <select
                      id="eventType"
                      {...register('eventType')}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        errors.eventType ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="corporate">Corporate Event</option>
                      <option value="private">Private Party</option>
                    </select>
                    {errors.eventType && (
                      <p className="text-sm text-red-600 mt-1">{errors.eventType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register('eventDate')}
                      className={errors.eventDate ? 'border-red-500' : ''}
                    />
                    {errors.eventDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.eventDate.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Count Step */}
            {currentStep === 'guest-count' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Guest Count & Appetite
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="guestCount">Number of Guests *</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="25"
                      {...register('guestCount', { valueAsNumber: true })}
                      className={errors.guestCount ? 'border-red-500' : ''}
                    />
                    {errors.guestCount && (
                      <p className="text-sm text-red-600 mt-1">{errors.guestCount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Hunger Level *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {HUNGER_LEVELS.map((level) => (
                        <label
                          key={level.value}
                          className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                            watch('hungerLevel') === level.value
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value={level.value}
                            {...register('hungerLevel')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{level.label}</div>
                            <div className="text-sm text-gray-500">{level.description}</div>
                          </div>
                          {watch('hungerLevel') === level.value && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.hungerLevel && (
                      <p className="text-sm text-red-600 mt-1">{errors.hungerLevel.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Step */}
            {currentStep === 'location' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Event Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Event Address *</Label>
                    <textarea
                      id="address"
                      rows={3}
                      placeholder="123 Main Street, Troy, NY 12180"
                      {...register('address')}
                      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                        errors.address ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Include any special delivery instructions or access codes
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Menu Selection Step */}
            {currentStep === 'menu-selection' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Menu Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {menuSelections.map((selection, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Menu Item #{index + 1}</h4>
                        {menuSelections.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMenuSelection(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Protein *</Label>
                          <select
                            value={selection.proteinId}
                            onChange={(e) => updateMenuSelection(index, { proteinId: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select a protein...</option>
                            {products.proteins.map((protein) => (
                              <option key={protein.id} value={protein.id}>
                                {protein.title} - {formatCurrency(protein.variants[0]?.prices[0]?.amount || 0)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label>Side *</Label>
                          <select
                            value={selection.sideId}
                            onChange={(e) => updateMenuSelection(index, { sideId: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select a side...</option>
                            {products.sides.map((side) => (
                              <option key={side.id} value={side.id}>
                                {side.title} - {formatCurrency(side.variants[0]?.prices[0]?.amount || 0)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label>Quantity (number of people)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selection.quantity}
                          onChange={(e) => updateMenuSelection(index, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMenuSelection}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Menu Item
                  </Button>

                  {errors.menuSelections && (
                    <p className="text-sm text-red-600">{errors.menuSelections.message}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add-ons Step */}
            {currentStep === 'addons' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Optional Add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map((addon) => {
                      const isSelected = addOns.some(a => a.addOnId === addon.id);
                      const selectedAddon = addOns.find(a => a.addOnId === addon.id);
                      
                      return (
                        <div
                          key={addon.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => toggleAddon(addon.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{addon.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {formatCurrency(addon.priceCents)}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                            )}
                          </div>
                          
                          {isSelected && (
                            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={selectedAddon?.quantity || 1}
                                onChange={(e) => updateAddonQuantity(addon.id, parseInt(e.target.value) || 1)}
                                className="w-24 mt-1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStepIndex < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quote Request'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Price Estimate Sidebar */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estimated Total
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(estimatedPrice)}
                </div>
                
                {pricingError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {pricingError}
                  </div>
                )}
                
                {currentPricing && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(currentPricing.subtotalCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(currentPricing.taxCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span>{formatCurrency(currentPricing.deliveryFeeCents)}</span>
                    </div>
                    <hr className="my-1" />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(currentPricing.totalCents)}</span>
                    </div>
                  </div>
                )}
                
                {guestCount > 0 && (
                  <div className="text-sm text-gray-600">
                    Approximately {formatCurrency(Math.round(estimatedPrice / guestCount))} per person
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span>{guestCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hunger Level:</span>
                    <span className="capitalize">{hungerLevel.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Menu Items:</span>
                    <span>{menuSelections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Add-ons:</span>
                    <span>{addOns.length}</span>
                  </div>
                </div>

                <hr />

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• This is an estimate only</p>
                  <p>• Final quote may vary based on delivery distance and requirements</p>
                  <p>• All prices include setup and cleanup</p>
                  <p>• Deposit required to confirm booking</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}