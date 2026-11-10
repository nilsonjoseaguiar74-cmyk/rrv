BEGIN;
INSERT INTO site_settings(key,value,status) VALUES
('company_name','RRV.digital','published'),('commercial_email','hello@rrv.digital','published'),
('home_headline','Growth.|Experience.|Engineering.','published'),
('home_subtitle','Strategy, craft and technology organized as one adaptive capability layer.','published'),
('home_primary_cta','Start a project','published'),('home_secondary_cta','Explore the system','published'),
('home_eyebrow','Independent digital collective','published'),
('start_offer_title','Transformamos ideias em software.','published'),('start_starting_price','A partir de R$ 199','published'),
('start_primary_cta','Iniciar projeto','published'),('whatsapp','','published'),('social_links','{}','published'),('footer_info','© 2026 RRV.digital','published')
ON CONFLICT(key) DO NOTHING;

INSERT INTO home_sections(slug,title,sort_order,status) VALUES
('hero','Hero',1,'published'),('work','Selected Work',2,'published'),('services','Services',3,'published'),
('disciplines','Disciplines',4,'published'),('people','Professionals',5,'published'),('capability','Capability Map',6,'published'),
('case','Case Preview',7,'published'),('contact','Contact CTA',8,'published') ON CONFLICT(slug) DO NOTHING;

INSERT INTO projects(slug,title,description,image_url,external_url,category,technologies,featured,sort_order,status) VALUES
('signal-growth-engine','Signal / Growth Engine','Paid Media · Analytics · Acquisition','/work/growth.png','#case-preview','growth','Paid Media, Analytics, Acquisition',true,1,'published'),
('arc-product-experience','Arc / Product Experience','Product Design · UX · Systems','/work/experience.png','#case-preview','experience','Product Design, UX, Systems',true,2,'published'),
('core-execution-layer','Core / Execution Layer','AI · Web3 · Architecture','/work/engineering.png','#case-preview','engineering','AI, Web3, Architecture',true,3,'published')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO team_members(slug,name,role,bio,discipline,sort_order,status) VALUES
('growth-strategy','Growth Strategy','Growth Strategy','Acquisition · Media · Analytics','growth',1,'published'),
('performance-systems','Performance Systems','Performance Systems','Creative · CRO · Attribution','growth',2,'published'),
('product-experience','Product Experience','Product Experience','UX/UI · Interaction · Research','experience',3,'published'),
('design-systems','Design Systems','Design Systems','Systems · Frontend · Motion','experience',4,'published'),
('solution-engineering','Solution Engineering','Solution Engineering','Fullstack · AI · Architecture','engineering',5,'published'),
('decentralized-systems','Decentralized Systems','Decentralized Systems','Web3 · Smart Contracts · DevOps','engineering',6,'published')
ON CONFLICT(slug) DO NOTHING;
COMMIT;
