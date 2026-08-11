-- Add character name validation constraints
ALTER TABLE public.characters 
ADD CONSTRAINT name_length CHECK (char_length(name) BETWEEN 1 AND 20);

ALTER TABLE public.characters 
ADD CONSTRAINT name_format CHECK (name ~ '^[A-Za-z0-9 -]+$');