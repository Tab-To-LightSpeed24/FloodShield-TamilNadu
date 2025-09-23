import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import { Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AlertBroadcaster = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSmsWhatsapp, setSendSmsWhatsapp] = useState(true);
  const [sendPushNotification, setSendPushNotification] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      showError("Message cannot be empty.");
      return;
    }
    if (sendPushNotification && !title.trim()) {
      showError("Title is required for push notifications.");
      return;
    }
    if (!sendSmsWhatsapp && !sendPushNotification) {
      showError("Please select at least one notification channel (SMS/WhatsApp or Push Notification).");
      return;
    }

    setIsSending(true);
    const toastId = showLoading("Broadcasting alert...");

    try {
      const promises = [];

      if (sendSmsWhatsapp) {
        promises.push(supabase.functions.invoke("send-bulk-alerts", {
          body: { message },
        }));
      }

      if (sendPushNotification) {
        promises.push(supabase.functions.invoke("send-push-notifications", {
          body: { title, message },
        }));
      }

      const results = await Promise.allSettled(promises);

      let successMessages: string[] = [];
      let errorMessages: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (index === 0 && sendSmsWhatsapp) successMessages.push(result.value.data.message || "SMS/WhatsApp alerts processed!");
          else if (index === (sendSmsWhatsapp ? 1 : 0) && sendPushNotification) successMessages.push(result.value.data.message || "Push notifications processed!");
        } else {
          const error = result.reason;
          let errorMessage = "An unknown error occurred.";
          if (error.context && typeof error.context.json === 'function') {
            try {
              const errorJson = await error.context.json();
              errorMessage = errorJson.error || `Function returned an unhandled error.`;
            } catch (e) {
              errorMessage = `Failed to parse error response from function.`;
            }
          } else {
            errorMessage = error.message;
          }
          errorMessages.push(errorMessage);
        }
      });

      dismissToast(toastId);
      if (errorMessages.length > 0) {
        showError(`Some alerts failed: ${errorMessages.join("; ")}`);
      }
      if (successMessages.length > 0) {
        showSuccess(successMessages.join(" "));
      }
      
      setTitle("");
      setMessage("");

    } catch (error: any) {
      dismissToast(toastId);
      showError(`Failed to send alerts: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broadcast Alert</CardTitle>
        <CardDescription>
          Send a message to users via selected channels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="send-sms-whatsapp"
            checked={sendSmsWhatsapp}
            onCheckedChange={setSendSmsWhatsapp}
            disabled={isSending}
          />
          <Label htmlFor="send-sms-whatsapp">Send via SMS & WhatsApp</Label>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Requires Twilio secrets (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`) to be configured.
        </p>

        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="send-push-notification"
            checked={sendPushNotification}
            onCheckedChange={setSendPushNotification}
            disabled={isSending}
          />
          <Label htmlFor="send-push-notification">Send Push Notification (Android)</Label>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Requires `FCM_SERVER_KEY` secret to be configured in Supabase.
        </p>

        {sendPushNotification && (
          <div>
            <Label htmlFor="alert-title">Notification Title</Label>
            <Input
              id="alert-title"
              placeholder="e.g., Flood Warning!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSending}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label htmlFor="alert-message">Message</Label>
          <Textarea
            id="alert-message"
            placeholder="Type your alert message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={isSending}
            className="mt-1"
          />
        </div>
        
        <Button onClick={handleSend} disabled={isSending || (!sendSmsWhatsapp && !sendPushNotification)}>
          <Send className="mr-2 h-4 w-4" />
          {isSending ? "Broadcasting..." : "Broadcast Alert"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlertBroadcaster;