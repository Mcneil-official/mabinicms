"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { yakapService, type YakapFormData } from "@/lib/services/yakap.service";
import { MABINI_BARANGAYS } from "@/lib/constants/barangays";

interface YakapFormStepProps {
  residentId: string;
  onSuccess?: () => void;
  existingData?: Partial<YakapFormData>;
}

export function YakapFormStep({
  residentId,
  onSuccess,
  existingData,
}: YakapFormStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<YakapFormData>({
    // Personal Information
    philhealthNo: existingData?.philhealthNo || "",
    lastName: existingData?.lastName || "",
    firstName: existingData?.firstName || "",
    middleName: existingData?.middleName || "",
    suffix: existingData?.suffix || "",
    sex: existingData?.sex || "",
    age: existingData?.age || "",
    birthdate: existingData?.birthdate || "",
    birthPlace: existingData?.birthPlace || "",
    civilStatus: existingData?.civilStatus || "",
    maidenLastName: existingData?.maidenLastName || "",
    maidenMiddleName: existingData?.maidenMiddleName || "",
    educationalAttainment: existingData?.educationalAttainment || "",
    employmentStatus: existingData?.employmentStatus || "",
    occupation: existingData?.occupation || "",
    religion: existingData?.religion || "",
    indigenous: existingData?.indigenous || "",
    bloodType: existingData?.bloodType || "",

    // Family Information
    motherFirstName: existingData?.motherFirstName || "",
    motherLastName: existingData?.motherLastName || "",
    motherMiddleName: existingData?.motherMiddleName || "",
    motherBirthdate: existingData?.motherBirthdate || "",
    fatherFirstName: existingData?.fatherFirstName || "",
    fatherLastName: existingData?.fatherLastName || "",
    fatherMiddleName: existingData?.fatherMiddleName || "",
    fatherBirthdate: existingData?.fatherBirthdate || "",
    spouseFirstName: existingData?.spouseFirstName || "",
    spouseLastName: existingData?.spouseLastName || "",
    spouseBirthdate: existingData?.spouseBirthdate || "",

    // Address & Contact
    streetAddress: existingData?.streetAddress || "",
    province: existingData?.province || "",
    cityMunicipality: existingData?.cityMunicipality || "",
    barangay: existingData?.barangay || "",
    email: existingData?.email || "",
    mobile: existingData?.mobile || "",

    // Membership
    membershipType: existingData?.membershipType || "",
    firstChoiceKPP: existingData?.firstChoiceKPP || "",
    secondChoiceKPP: existingData?.secondChoiceKPP || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Personal Information
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.sex) newErrors.sex = "Sex is required";
        if (!formData.birthdate) newErrors.birthdate = "Birthdate is required";
        break;

      case 2:
        // Address & Contact
        if (!formData.streetAddress)
          newErrors.streetAddress = "Street address is required";
        if (!formData.barangay) newErrors.barangay = "Barangay is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.mobile) newErrors.mobile = "Mobile number is required";
        break;

      case 3:
        // Membership Type
        if (!formData.membershipType)
          newErrors.membershipType = "Membership type is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await yakapService.submitApplication(formData, residentId);

      if (!result.success) {
        setError(result.error || "Failed to submit application");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof YakapFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PhilHealth Konsulta (YAKAP) Application</CardTitle>
        <CardDescription>
          Step {currentStep} of 3 - Complete the form to submit your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Fields */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dela Cruz"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Santos"
                    value={formData.middleName}
                    onChange={(e) => updateField("middleName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    placeholder="Jr., Sr., III"
                    value={formData.suffix}
                    onChange={(e) => updateField("suffix", e.target.value)}
                  />
                </div>

                {/* Birth Information */}
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date of Birth *</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => updateField("birthdate", e.target.value)}
                  />
                  {errors.birthdate && (
                    <p className="text-sm text-red-600">{errors.birthdate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => updateField("age", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex *</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => updateField("sex", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && (
                    <p className="text-sm text-red-600">{errors.sex}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Place of Birth</Label>
                  <Input
                    id="birthPlace"
                    placeholder="City/Municipality"
                    value={formData.birthPlace}
                    onChange={(e) => updateField("birthPlace", e.target.value)}
                  />
                </div>

                {/* Civil Status */}
                <div className="space-y-2">
                  <Label htmlFor="civilStatus">Civil Status</Label>
                  <Select
                    value={formData.civilStatus}
                    onValueChange={(value) => updateField("civilStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select civil status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                      <SelectItem value="annulled">Annulled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) => updateField("bloodType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Info */}
                <div className="space-y-2">
                  <Label htmlFor="educationalAttainment">
                    Educational Attainment
                  </Label>
                  <Select
                    value={formData.educationalAttainment}
                    onValueChange={(value) =>
                      updateField("educationalAttainment", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select attainment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Formal Education</SelectItem>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="highschool">High School</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select
                    value={formData.employmentStatus}
                    onValueChange={(value) =>
                      updateField("employmentStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="self-employed">
                        Self-Employed
                      </SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="housewife">Housewife</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="Job title or occupation"
                    value={formData.occupation}
                    onChange={(e) => updateField("occupation", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    placeholder="Religious faith"
                    value={formData.religion}
                    onChange={(e) => updateField("religion", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indigenous">Indigenous Group</Label>
                  <Input
                    id="indigenous"
                    placeholder="If applicable"
                    value={formData.indigenous}
                    onChange={(e) => updateField("indigenous", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="philhealthNo">PhilHealth Number</Label>
                  <Input
                    id="philhealthNo"
                    placeholder="12-345678901-2"
                    value={formData.philhealthNo}
                    onChange={(e) =>
                      updateField("philhealthNo", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address & Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Address Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="streetAddress">Street Address *</Label>
                    <Textarea
                      id="streetAddress"
                      placeholder="House/Building number and street name"
                      value={formData.streetAddress}
                      onChange={(e) =>
                        updateField("streetAddress", e.target.value)
                      }
                      rows={2}
                    />
                    {errors.streetAddress && (
                      <p className="text-sm text-red-600">
                        {errors.streetAddress}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      placeholder="Province"
                      value={formData.province}
                      onChange={(e) => updateField("province", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cityMunicipality">City/Municipality</Label>
                    <Input
                      id="cityMunicipality"
                      placeholder="City or Municipality"
                      value={formData.cityMunicipality}
                      onChange={(e) =>
                        updateField("cityMunicipality", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay *</Label>
                    <Select
                      value={formData.barangay}
                      onValueChange={(value) => updateField("barangay", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {MABINI_BARANGAYS.map((barangay) => (
                          <SelectItem key={barangay} value={barangay}>
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.barangay && (
                      <p className="text-sm text-red-600">{errors.barangay}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="09xxxxxxxxx"
                      value={formData.mobile}
                      onChange={(e) => updateField("mobile", e.target.value)}
                    />
                    {errors.mobile && (
                      <p className="text-sm text-red-600">{errors.mobile}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Family & Membership Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Family Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mother's Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Mother</h4>
                    <div className="space-y-2">
                      <Label htmlFor="motherFirstName">First Name</Label>
                      <Input
                        id="motherFirstName"
                        placeholder="Mother's first name"
                        value={formData.motherFirstName}
                        onChange={(e) =>
                          updateField("motherFirstName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherLastName">Last Name</Label>
                      <Input
                        id="motherLastName"
                        placeholder="Mother's last name"
                        value={formData.motherLastName}
                        onChange={(e) =>
                          updateField("motherLastName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherMiddleName">Middle Name</Label>
                      <Input
                        id="motherMiddleName"
                        placeholder="Mother's middle name"
                        value={formData.motherMiddleName}
                        onChange={(e) =>
                          updateField("motherMiddleName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherBirthdate">Date of Birth</Label>
                      <Input
                        id="motherBirthdate"
                        type="date"
                        value={formData.motherBirthdate}
                        onChange={(e) =>
                          updateField("motherBirthdate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Father's Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Father</h4>
                    <div className="space-y-2">
                      <Label htmlFor="fatherFirstName">First Name</Label>
                      <Input
                        id="fatherFirstName"
                        placeholder="Father's first name"
                        value={formData.fatherFirstName}
                        onChange={(e) =>
                          updateField("fatherFirstName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherLastName">Last Name</Label>
                      <Input
                        id="fatherLastName"
                        placeholder="Father's last name"
                        value={formData.fatherLastName}
                        onChange={(e) =>
                          updateField("fatherLastName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherMiddleName">Middle Name</Label>
                      <Input
                        id="fatherMiddleName"
                        placeholder="Father's middle name"
                        value={formData.fatherMiddleName}
                        onChange={(e) =>
                          updateField("fatherMiddleName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherBirthdate">Date of Birth</Label>
                      <Input
                        id="fatherBirthdate"
                        type="date"
                        value={formData.fatherBirthdate}
                        onChange={(e) =>
                          updateField("fatherBirthdate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Spouse Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Spouse (if applicable)
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="spouseFirstName">First Name</Label>
                      <Input
                        id="spouseFirstName"
                        placeholder="Spouse's first name"
                        value={formData.spouseFirstName}
                        onChange={(e) =>
                          updateField("spouseFirstName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouseLastName">Last Name</Label>
                      <Input
                        id="spouseLastName"
                        placeholder="Spouse's last name"
                        value={formData.spouseLastName}
                        onChange={(e) =>
                          updateField("spouseLastName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouseBirthdate">Date of Birth</Label>
                      <Input
                        id="spouseBirthdate"
                        type="date"
                        value={formData.spouseBirthdate}
                        onChange={(e) =>
                          updateField("spouseBirthdate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Membership Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipType">Membership Type *</Label>
                    <Select
                      value={formData.membershipType}
                      onValueChange={(value) =>
                        updateField("membershipType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Senior">Senior Citizen</SelectItem>
                        <SelectItem value="PWD">
                          Person with Disability (PWD)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.membershipType && (
                      <p className="text-sm text-red-600">
                        {errors.membershipType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstChoiceKPP">
                      First Choice Health Provider
                    </Label>
                    <Input
                      id="firstChoiceKPP"
                      placeholder="Name of health facility"
                      value={formData.firstChoiceKPP}
                      onChange={(e) =>
                        updateField("firstChoiceKPP", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondChoiceKPP">
                      Second Choice Health Provider
                    </Label>
                    <Input
                      id="secondChoiceKPP"
                      placeholder="Name of health facility"
                      value={formData.secondChoiceKPP}
                      onChange={(e) =>
                        updateField("secondChoiceKPP", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex gap-3 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <p>YAKAP application submitted successfully!</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep < 3 && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Next Step
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            * Required fields. All information will be securely stored and used
            for PhilHealth Konsulta registration.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
