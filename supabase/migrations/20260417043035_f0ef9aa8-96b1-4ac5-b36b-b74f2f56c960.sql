-- Trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  name TEXT NOT NULL,
  location TEXT,
  trip_date DATE NOT NULL,
  trip_time TIME,
  price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON public.trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trips_user_sport ON public.trips(user_id, sport);
CREATE INDEX idx_trips_date ON public.trips(trip_date);

-- Trip participants table
CREATE TABLE public.trip_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  final_paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, player_id)
);

ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip participants" ON public.trip_participants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trip participants" ON public.trip_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trip participants" ON public.trip_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trip participants" ON public.trip_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_trip_participants_updated_at
  BEFORE UPDATE ON public.trip_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trip_participants_trip ON public.trip_participants(trip_id);
CREATE INDEX idx_trip_participants_player ON public.trip_participants(player_id);