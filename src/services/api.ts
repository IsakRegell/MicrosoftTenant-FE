import { CompareResponse, Decision } from '@/types/diff';

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:7134";

export async function compareCheck(customerId: string): Promise<CompareResponse> {
  try {
    const res = await fetch(`${BASE}/compare/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId })
    });
    if (!res.ok) throw new Error("compare/check failed");
    return res.json();
  } catch (error) {
    console.warn("Backend not available, using mock data");
    return getMockCompareResponse(customerId);
  }
}

export async function compareApply(customerId: string, decisions: Decision[]): Promise<CompareResponse> {
  try {
    const res = await fetch(`${BASE}/compare/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, decisions })
    });
    if (!res.ok) throw new Error("compare/apply failed");
    return res.json();
  } catch (error) {
    console.warn("Backend not available, simulating apply");
    return getMockApplyResponse(customerId, decisions);
  }
}

// MOCK START - Remove when backend is ready
function getMockCompareResponse(customerId: string): CompareResponse {
  const template = {
    user: {
      id: "template-user",
      name: "Template User",
      age: 30,
      email: "user@template.com",
      settings: {
        theme: "light",
        notifications: true,
        language: "sv"
      },
      permissions: ["read", "write"]
    },
    application: {
      version: "1.0.0",
      features: ["feature1", "feature2"]
    }
  };

  const customerData = customerId === "volvo" ? {
    user: {
      id: "volvo-123",
      name: "Volvo User", 
      age: "35", // Type mismatch - string instead of number
      email: "user@volvo.com",
      settings: {
        theme: "dark", // Value mismatch
        notifications: true,
        language: "sv",
        customOption: "volvo-specific" // Unexpected property
      },
      permissions: ["read"] // Length mismatch - missing write
    },
    application: {
      version: "1.0.0",
      features: ["feature1", "feature2", "volvo-feature"] // Length mismatch
    }
  } : {
    user: {
      id: "scania-456",
      name: "Scania User",
      age: 28,
      // Missing email property
      settings: {
        theme: "light",
        notifications: false, // Value mismatch
        language: "en" // Value mismatch
      },
      permissions: ["read", "write", "admin"] // Length mismatch
    },
    application: {
      version: "1.1.0", // Value mismatch
      features: ["feature1"] // Length mismatch
    }
  };

  const diffs = customerId === "volvo" ? [
    {
      path: "/user/age",
      type: "typeMismatch" as const,
      expected: 30,
      actual: "35",
      severity: "error" as const,
      suggestion: "applyTemplate"
    },
    {
      path: "/user/settings/theme",
      type: "valueMismatch" as const,
      expected: "light",
      actual: "dark",
      severity: "warn" as const
    },
    {
      path: "/user/settings/customOption",
      type: "unexpected" as const,
      actual: "volvo-specific",
      severity: "info" as const
    },
    {
      path: "/user/permissions",
      type: "lengthMismatch" as const,
      expected: ["read", "write"],
      actual: ["read"],
      severity: "warn" as const
    }
  ] : [
    {
      path: "/user/email",
      type: "missing" as const,
      expected: "user@template.com",
      severity: "error" as const,
      suggestion: "copyFromTemplate"
    },
    {
      path: "/user/settings/notifications",
      type: "valueMismatch" as const,
      expected: true,
      actual: false,
      severity: "warn" as const
    },
    {
      path: "/user/settings/language",
      type: "valueMismatch" as const,
      expected: "sv",
      actual: "en",
      severity: "info" as const
    },
    {
      path: "/application/version",
      type: "valueMismatch" as const,
      expected: "1.0.0",
      actual: "1.1.0",
      severity: "warn" as const
    }
  ];

  return { template, customerData, diffs };
}

function getMockApplyResponse(customerId: string, decisions: Decision[]): CompareResponse {
  // Simulate applying decisions and return updated data
  const mockResponse = getMockCompareResponse(customerId);
  
  // Apply decisions to customer data (simplified simulation)
  let updatedCustomerData = { ...mockResponse.customerData };
  let updatedDiffs = [...mockResponse.diffs];

  decisions.forEach(decision => {
    if (decision.action === "applyTemplate") {
      // Remove the diff since it's been resolved
      updatedDiffs = updatedDiffs.filter(diff => diff.path !== decision.path);
    }
  });

  return {
    template: mockResponse.template,
    customerData: updatedCustomerData,
    diffs: updatedDiffs
  };
}
// MOCK END