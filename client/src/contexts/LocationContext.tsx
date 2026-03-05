import { createContext, useContext, useState, ReactNode } from "react";
import htownLogo from "@assets/htown-logo_1772190875526.png";
import dtownLogo from "@assets/dtown-logo_1772190875524.png";

export interface Location {
  id: number;
  name: string;
  address: string;
  logo: string;
}

export const LOCATIONS: Location[] = [
  { id: 1, name: "H-Town ATV Rentals", address: "807 Highway 90 Crosby, TX 77532", logo: htownLogo },
  { id: 2, name: "D-Town ATV Rentals", address: "5455 Everman Kennedale Rd, Fort Worth, TX 76140", logo: dtownLogo },
];

interface LocationContextType {
  selectedLocation: Location;
  setSelectedLocation: (location: Location) => void;
  tenantId: number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location>(LOCATIONS[0]);

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        tenantId: selectedLocation.id,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation2() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation2 must be used within a LocationProvider");
  }
  return context;
}
