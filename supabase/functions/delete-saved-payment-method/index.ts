import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient()
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development; restrict in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specify allowed methods
};

serve(async (req: Request) => {
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { payment_method_id } = await req.json()

  try {
    // Detach the payment method from the customer in Stripe
    await stripe.paymentMethods.detach(payment_method_id)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete the payment method from our database
    const { error } = await supabaseAdmin
      .from('saved_payment_methods')
      .delete()
      .eq('provider_payment_method_id', payment_method_id)

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});