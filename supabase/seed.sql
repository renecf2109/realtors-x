-- Optional demo data. Replace AGENT_USER_ID with an agent UUID from Authentication > Users.
insert into public.properties (agent_id,title,price,location,bedrooms,bathrooms,size,type,description,features,availability) values
('AGENT_USER_ID','Sunlit City Apartment',1450,'Hamra, Beirut',2,2,1180,'apartment','A bright, renovated apartment close to cafes and daily essentials.',array['balcony','parking','elevator'],'available'),
('AGENT_USER_ID','Garden Family Villa',3200,'Rabieh, Metn',4,3.5,3100,'villa','A calm family home with generous indoor and outdoor living space.',array['garden','parking','pet friendly'],'available'),
('AGENT_USER_ID','Modern Waterfront Studio',950,'Mar Mikhael, Beirut',0,1,520,'studio','An efficient furnished studio with an open view and excellent walkability.',array['furnished','sea view','elevator'],'available');
