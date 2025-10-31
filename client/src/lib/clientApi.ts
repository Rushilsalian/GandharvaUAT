import { apiClient } from './apiClient';

export class ClientAPI {
  // Get client by ID
  async getClient(clientId: number) {
    return apiClient.get(`/mst/clients/${clientId}`);
  }

  // Get all clients
  async getAllClients() {
    return apiClient.get('/mst/clients');
  }

  // Get client by code
  async getClientByCode(code: string) {
    const clients = await this.getAllClients();
    return clients.find((client: any) => client.code === code);
  }
}

export const clientAPI = new ClientAPI();