// "Rå" kund som kan komma från API i olika format
export type CustomerApi = {
  _id?: string;          // Mongo standard
  id?: string;           // ibland .NET mappning
  objectId?: string;     // om du redan exponerar detta
  customerId?: string;   // t.ex. "teslaIt"
  name: string;
  contactEmail?: string;
  orgNumber?: string;
  isActive?: boolean;
};

// Normaliserad kund i FE
export type Customer = {
  objectId: string;      // alltid satt efter mappning
  customerId?: string;
  name: string;
  contactEmail?: string;
  orgNumber?: string;
  isActive: boolean;
};

// List-rad för UI (kompatibel med din AdminPanel/Sidebar)
export type CustomerListItem = {
  id: string;            // används av Sidebar/AdminPanel som "val"
  customerId: string;    // samma värde som id (ex. "volvo")
  name: string;
  orgNumber?: string;
  contactEmail?: string;
  isActive: boolean;
};

