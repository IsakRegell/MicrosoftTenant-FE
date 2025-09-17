import { CustomerListItem } from '@/types/customer';

// TODO: Replace with real backend endpoint, ex: GET /customers
export async function listCustomers(): Promise<CustomerListItem[]> {
  // MOCK data until backend is ready
  return [
    { 
      id: "volvo", 
      name: "Volvo", 
      orgNumber: "556000-0000", 
      contactEmail: "it@volvo.se" 
    },
    { 
      id: "scania", 
      name: "Scania", 
      orgNumber: "556111-1111", 
      contactEmail: "it@scania.se" 
    },
    {
      id: "ericsson",
      name: "Ericsson",
      orgNumber: "556222-2222",
      contactEmail: "it@ericsson.se"
    }
  ];
}