import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image, Video, FileText, Gift, Eye, Settings } from "lucide-react";

export function ContentManagementGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            How to Add Offers and Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adding Offers Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Adding Offers
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Click "Add Offer" button</p>
                  <p className="text-muted-foreground">Navigate to the Offers tab and click the "Add Offer" button</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Fill in offer details</p>
                  <ul className="text-muted-foreground list-disc list-inside ml-4">
                    <li>Title: Catchy offer title (e.g., "Special Investment Opportunity")</li>
                    <li>Description: Detailed description of the offer</li>
                    <li>Link URL: Optional link to more information</li>
                    <li>Valid From/To: Set offer validity period</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Upload offer image</p>
                  <p className="text-muted-foreground">Choose an attractive image (JPG, PNG, GIF) - recommended size: 800x400px</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <div>
                  <p className="font-medium">Set display order and activate</p>
                  <p className="text-muted-foreground">Lower numbers appear first. Toggle "Active" to make it visible to users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Adding Content Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Adding Content Items
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Choose content type</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Image className="h-3 w-3 mr-1" />
                      Image
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Text
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Add content details</p>
                  <ul className="text-muted-foreground list-disc list-inside ml-4">
                    <li>Title: Content headline</li>
                    <li>Description: Brief summary</li>
                    <li>Content: Full content text</li>
                    <li>Category: Select appropriate category</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Upload media (if applicable)</p>
                  <ul className="text-muted-foreground list-disc list-inside ml-4">
                    <li>Images: JPG, PNG, GIF (max 10MB)</li>
                    <li>Videos: MP4, MOV, AVI, WebM (max 10MB)</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <div>
                  <p className="font-medium">Publish content</p>
                  <p className="text-muted-foreground">Toggle "Published" to make it visible on the offers page</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Guidelines */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload Guidelines
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Maximum file size: 10MB</li>
              <li>• Supported image formats: JPG, JPEG, PNG, GIF</li>
              <li>• Supported video formats: MP4, MOV, AVI, WebM</li>
              <li>• Recommended image dimensions: 800x400px for offers, 600x400px for content</li>
              <li>• Use high-quality images for better user experience</li>
            </ul>
          </div>

          {/* Viewing Content */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Viewing Your Content
            </h4>
            <p className="text-sm text-muted-foreground">
              Users can view active offers and published content by clicking the "View Offers" button in the sidebar. 
              The offers will auto-scroll every 5 seconds, and content items will be displayed in a gallery format.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}