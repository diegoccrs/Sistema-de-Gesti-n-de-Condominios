import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import Stripe from 'https://esm.sh/stripe@12.18.0'
import { corsHeaders } from '../_shared/cors.ts' // Import shared headers

serve(async (req: Request) => { // Added Request type
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentMethodId } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const detachedPaymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete the payment method from our database
    const { error } = await supabaseAdmin
      .from('saved_payment_methods')
      .delete()
      .eq('provider_payment_method_id', paymentMethodId)

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) { // Added any type for error
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});