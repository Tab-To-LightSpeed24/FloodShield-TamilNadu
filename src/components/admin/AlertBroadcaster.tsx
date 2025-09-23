import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import { Send } from "lucide-react";

const AlertBroadcaster = () => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      showError("Message cannot be empty.");
      return;
    }
    setIsSending(true);
    const toastId = showLoading("Broadcasting alert via SMS & WhatsApp...");

    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-alerts", {
        body: { message },
      });

      if (error) throw error;

      dismissToast(toastId);
      showSuccess(data.message || "Alerts broadcast processed!");
      setMessage("");
    } catch (error: any) {
      dismissToast(toastId);
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
      showError(`Failed to send alerts: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broadcast Alert</CardTitle>
        <CardDescription>
          Send a message to all users with a phone number via SMS and WhatsApp. This requires Twilio secrets to be configured, including a new `TWILIO_WHATSAPP_NUMBER` for WhatsApp functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Type your alert message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={isSending}
        />
        <Button onClick={handleSend} disabled={isSending || !message.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isSending ? "Sending..." : "Send Broadcast"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlertBroadcaster;