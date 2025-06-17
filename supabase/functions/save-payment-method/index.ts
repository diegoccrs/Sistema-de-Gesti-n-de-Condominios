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

  const { resident_id, payment_method_id } = await req.json()

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', resident_id)
      .single()

    if (profileError || !profile.stripe_customer_id) {
      throw new Error('Stripe customer not found for this resident.')
    }

    // Attach the payment method to the customer in Stripe
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: profile.stripe_customer_id,
    })

    // Get payment method details to store in our database
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)

    const { error: insertError } = await supabaseAdmin
      .from('saved_payment_methods')
      .insert({
        resident_id: resident_id,
        provider: 'stripe',
        provider_payment_method_id: payment_method_id,
        card_details: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      })

    if (insertError) throw insertError;

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