import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Upload, Image, Video, FileText, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentManagementGuide } from "@/components/ContentManagementGuide";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  mediaType: 'image' | 'video' | 'text';
  mediaUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  categoryName: string;
  creatorName: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  linkUrl: string;
  validFrom: string;
  validTo: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  creatorName: string;
}

interface ContentCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function ContentManagementPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("guide");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | Offer | null>(null);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    mediaType: "image" as 'image' | 'video' | 'text',
    categoryId: "",
    displayOrder: 0,
    isActive: true,
    isPublished: false,
    linkUrl: "",
    validFrom: "",
    validTo: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contentRes, offersRes, categoriesRes] = await Promise.all([
        fetch('/api/content'),
        fetch('/api/content/offers'),
        fetch('/api/content/categories')
      ]);

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setContentItems(contentData);
      }

      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Frontend - Form data before submission:', formData);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          console.log(`Frontend - Adding ${key}:`, value, 'as string:', value.toString());
          formDataToSend.append(key, value.toString());
        }
      });

      // Add file if selected
      if (selectedFile) {
        const fieldName = selectedTab === 'content' ? 'media' : 'image';
        formDataToSend.append(fieldName, selectedFile);
      }
      
      // Add flag to remove existing file
      if (removeExistingFile) {
        formDataToSend.append('removeExistingFile', 'true');
      }

  const endpoint = selectedTab === 'content' ? '/api/content' : '/api/content/offers';
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedTab === 'content' ? 'Content' : 'Offer'} ${editingItem ? 'updated' : 'created'} successfully`
        });
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
  const endpoint = selectedTab === 'content' ? '/api/content' : '/api/content/offers';
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item deleted successfully"
        });
        fetchData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      mediaType: "image",
      categoryId: "",
      displayOrder: 0,
      isActive: true,
      isPublished: false,
      linkUrl: "",
      validFrom: "",
      validTo: ""
    });
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setEditingItem(null);
  };

  const openEditDialog = (item: ContentItem | Offer) => {
    setEditingItem(item);
    if ('content' in item) {
      // Content item
      setFormData({
        title: item.title,
        description: item.description,
        content: item.content,
        mediaType: item.mediaType,
        categoryId: "",
        displayOrder: item.displayOrder,
        isActive: item.isActive,
        isPublished: item.isPublished,
        linkUrl: "",
        validFrom: "",
        validTo: ""
      });
    } else {
      // Offer
      setFormData({
        title: item.title,
        description: item.description,
        content: "",
        mediaType: (item.mediaType as 'image' | 'video' | 'text') || "image",
        categoryId: "",
        displayOrder: item.displayOrder,
        isActive: item.isActive,
        isPublished: false,
        linkUrl: item.linkUrl,
        validFrom: item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : "",
        validTo: item.validTo ? new Date(item.validTo).toISOString().split('T')[0] : ""
      });
    }
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setIsDialogOpen(true);
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Content Management</h1>
        {selectedTab !== 'categories' && selectedTab !== 'guide' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedTab === 'content' ? 'Content' : 'Offer'}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} {selectedTab === 'content' ? 'Content' : 'Offer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {selectedTab === 'content' && (
                <>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mediaType">Media Type</Label>
                    <Select value={formData.mediaType} onValueChange={(value: 'image' | 'video' | 'text') => setFormData({ ...formData, mediaType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedTab === 'offers' && (
                <>
                  <div>
                    <Label htmlFor="mediaType">Media Type</Label>
                    <Select value={formData.mediaType} onValueChange={(value: 'image' | 'video' | 'text') => setFormData({ ...formData, mediaType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="linkUrl">Link URL</Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validFrom">Valid From</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="validTo">Valid To</Label>
                      <Input
                        id="validTo"
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="media">Media</Label>
                {editingItem && !removeExistingFile && (
                  <div className="mb-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current File:</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setRemoveExistingFile(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    {selectedTab === 'content' && 'mediaUrl' in editingItem && editingItem.mediaUrl && (
                      <div className="mb-2">
                        {editingItem.mediaType === 'image' ? (
                          <img src={editingItem.mediaUrl} alt={editingItem.title} className="h-20 w-20 object-cover rounded" />
                        ) : editingItem.mediaType === 'video' ? (
                          <video src={editingItem.mediaUrl} className="h-20 w-32 object-cover rounded" controls />
                        ) : (
                          <div className="text-sm text-muted-foreground">Text content</div>
                        )}
                      </div>
                    )}
                    {selectedTab === 'offers' && (
                      ('mediaUrl' in editingItem && editingItem.mediaUrl) ? (
                        editingItem.mediaType === 'video' ? (
                          <video src={editingItem.mediaUrl} className="h-20 w-32 object-cover rounded" controls />
                        ) : (
                          <img src={editingItem.mediaUrl} alt={editingItem.title} className="h-20 w-20 object-cover rounded" />
                        )
                      ) : (
                        'imageUrl' in editingItem && editingItem.imageUrl && (
                          <img src={editingItem.imageUrl} alt={editingItem.title} className="h-20 w-20 object-cover rounded" />
                        )
                      )
                    )}
                  </div>
                )}
                {(!editingItem || removeExistingFile) && (
                  <Input
                    id="media"
                    type="file"
                    accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                )}
                {removeExistingFile && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoveExistingFile(false)}
                    >
                      Keep Current File
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                {selectedTab === 'content' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="guide">How to Use</TabsTrigger>
          <TabsTrigger value="content">Content Items</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="grid gap-4">
            {contentItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getMediaIcon(item.mediaType)}
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={item.isPublished ? "default" : "outline"}>
                      {item.isPublished ? "Published" : "Unpublished"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  {item.mediaUrl && (
                    <div className="mb-2">
                      {item.mediaType === 'image' ? (
                        <img src={item.mediaUrl} alt={item.title} className="h-20 w-20 object-cover rounded" />
                      ) : item.mediaType === 'video' ? (
                        <video src={item.mediaUrl} className="h-20 w-32 object-cover rounded" controls />
                      ) : null}
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Category: {item.categoryName || 'None'}</span>
                    <span>Order: {item.displayOrder}</span>
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div className="grid gap-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg truncate pr-2">{offer.title}</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={offer.isActive ? "default" : "secondary"}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(offer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                  {(offer.mediaUrl || offer.imageUrl) && (
                    <div className="mb-2">
                      {offer.mediaUrl ? (
                        offer.mediaType === 'video' ? (
                          <video src={offer.mediaUrl} className="h-20 w-32 object-cover rounded" controls />
                        ) : (
                          <img src={offer.mediaUrl} alt={offer.title} className="h-20 w-20 object-cover rounded" />
                        )
                      ) : offer.imageUrl ? (
                        <img src={offer.imageUrl} alt={offer.title} className="h-20 w-20 object-cover rounded" />
                      ) : null}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span className="truncate">Valid: {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString() : 'N/A'} - {offer.validTo ? new Date(offer.validTo).toLocaleDateString() : 'N/A'}</span>
                    <span className="text-right sm:text-left">Order: {offer.displayOrder}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guide">
          <ContentManagementGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}