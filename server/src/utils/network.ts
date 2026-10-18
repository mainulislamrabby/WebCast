import os from "os";

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: string;
}

export const getLocalIpAddresses = (): NetworkInterfaceInfo[] => {
  const interfaces = os.networkInterfaces();
  const addresses: NetworkInterfaceInfo[] = [];

  for (const [name, netInterface] of Object.entries(interfaces)) {
    if (!netInterface) continue;

    for (const net of netInterface) {
      // Look for IPv4 addresses that are not internal loopback
      if (net.family === "IPv4" && !net.internal) {
        addresses.push({
          name,
          address: net.address,
          family: net.family,
        });
      }
    }
  }

  return addresses;
};

export const getPrimaryLocalIp = (): string => {
  const ips = getLocalIpAddresses();
  if (ips.length === 0) return "localhost";

  // Prioritize typical Wi-Fi / Ethernet adapters
  const preferred = ips.find(
    (i) =>
      i.name.toLowerCase().includes("wi-fi") ||
      i.name.toLowerCase().includes("wlan") ||
      i.name.toLowerCase().includes("eth") ||
      i.name.toLowerCase().includes("ethernet")
  );

  return preferred ? preferred.address : ips[0].address;
};
