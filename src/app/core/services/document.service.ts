import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../infrastructure/supabase/supabase.service';
import { Document } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = inject(SupabaseService).supabase;
  }

  /**
   * Fetches a list of documents, with optional filtering.
   * @param filters - An object containing filters for category and/or keyword.
   * @returns A promise that resolves to an array of documents.
   */
  async getDocuments(filters?: { category?: string; keyword?: string }): Promise<Document[]> {
    let query = this.supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.keyword) {
      // Using .or() for a broad search across title and description
      query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Uploads a file to storage and creates a corresponding record in the database.
   * @param file - The file to upload.
   * @param documentData - The metadata for the document.
   * @returns A promise that resolves when the upload is complete.
   */
  async uploadDocument(file: File, documentData: { title: string; description: string; category: string }): Promise<void> {
    const user = (await this.supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User must be logged in to upload documents.');
    }

    const filePath = `public/${user.id}/${Date.now()}_${file.name}`;

    // 1. Upload the file to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from('condo-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // 2. Create the document record in the database
    const { error: dbError } = await this.supabase
      .from('documents')
      .insert({
        title: documentData.title,
        description: documentData.description,
        category: documentData.category,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        user_id: user.id
      });

    if (dbError) {
      console.error('Error creating document record:', dbError);
      // If the DB insert fails, we should try to clean up the uploaded file
      await this.supabase.storage.from('condo-documents').remove([filePath]);
      throw dbError;
    }
  }

  /**
   * Deletes a document record and its corresponding file from storage.
   * @param documentId - The ID of the document to delete.
   * @param filePath - The path of the file to delete from storage.
   */
  async deleteDocument(documentId: string, filePath: string): Promise<void> {
    // 1. Delete the file from Storage
    const { error: storageError } = await this.supabase.storage
      .from('condo-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      throw storageError;
    }

    // 2. Delete the record from the database
    const { error: dbError } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document record:', dbError);
      throw dbError;
    }
  }

  /**
   * Generates a temporary, secure URL to download a file and initiates the download.
   * @param filePath - The path of the file in the storage bucket.
   * @param fileName - The original name of the file for the download attribute.
   */
  async downloadDocument(filePath: string, fileName: string): Promise<void> {
    const { data, error } = await this.supabase.storage
      .from('condo-documents')
      .createSignedUrl(filePath, 60); // URL is valid for 60 seconds

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    // Use the signed URL to trigger a download in the browser
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.setAttribute('download', fileName); // This ensures the file downloads with its original name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}