import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import type { AdminSettings, DaySchedule } from '../../types';

interface BusinessHoursEditorProps {
  control: Control<AdminSettings>;
  errors?: any;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function BusinessHoursEditor({ control, errors }: BusinessHoursEditorProps) {
  const [isAllSameHours, setIsAllSameHours] = React.useState(false);
  const [templateHours, setTemplateHours] = React.useState({
    openTime: '10:00',
    closeTime: '20:00'
  });

  const applyToAllDays = () => {
    // This would need to be implemented with setValue from useForm
    // For now, it's a placeholder for the UI
    console.log('Apply template hours to all days:', templateHours);
  };

  const renderDaySchedule = (dayKey: string, dayLabel: string) => {
    return (
      <div key={dayKey} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Label className="font-medium min-w-[80px]">{dayLabel}</Label>
          <Switch
            name={`businessHours.${dayKey}.isOpen`}
            defaultChecked={true}
          />
          <span className="text-sm text-gray-600">Open</span>
        </div>

        <div className="flex flex-col space-y-1">
          <Label htmlFor={`businessHours.${dayKey}.openTime`} className="text-sm">
            Opening Time
          </Label>
          <Input
            id={`businessHours.${dayKey}.openTime`}
            name={`businessHours.${dayKey}.openTime`}
            type="time"
            defaultValue="10:00"
            className="w-full"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <Label htmlFor={`businessHours.${dayKey}.closeTime`} className="text-sm">
            Closing Time
          </Label>
          <Input
            id={`businessHours.${dayKey}.closeTime`}
            name={`businessHours.${dayKey}.closeTime`}
            type="time"
            defaultValue="20:00"
            className="w-full"
          />
        </div>

        <div className="text-sm text-gray-500">
          {/* Hours display will be calculated */}
          <span>10 hours</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Business Hours
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isAllSameHours}
                onChange={setIsAllSameHours}
              />
              <span>Same hours all days</span>
            </div>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set your restaurant's operating hours for each day of the week
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAllSameHours && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Template Hours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="template-open" className="text-sm">Opening Time</Label>
                <Input
                  id="template-open"
                  type="time"
                  value={templateHours.openTime}
                  onChange={(e) => setTemplateHours(prev => ({ ...prev, openTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="template-close" className="text-sm">Closing Time</Label>
                <Input
                  id="template-close"
                  type="time"
                  value={templateHours.closeTime}
                  onChange={(e) => setTemplateHours(prev => ({ ...prev, closeTime: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={applyToAllDays}
                className="h-10"
              >
                Apply to All Days
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => renderDaySchedule(key, label))}
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-medium text-amber-900 mb-2">Special Hours & Holidays</h4>
          <p className="text-sm text-amber-800 mb-3">
            Set special hours for holidays, events, or temporary schedule changes.
          </p>
          <Button type="button" variant="outline" size="sm">
            Manage Special Hours
          </Button>
        </div>

        {errors?.businessHours && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            Please check your business hours configuration
          </div>
        )}
      </CardContent>
    </Card>
  );
}