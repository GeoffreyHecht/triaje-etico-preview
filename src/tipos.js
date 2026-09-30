// Contrato compartido de Triaje Ético MT (W2). Detalle y semántica: specs/05-diseno.md.
// Solo tipos: el archivo queda vacío al quitar los tipos. Importar siempre con
// `import type { ... } from './tipos.js'` (con type stripping, un import de valor falla).
// Cambiar este archivo es tarea del orquestador (CLAUDE.md, «specs antes que código»).

// ---------------------------------------------------------------------------
// Identificadores y valores básicos (ids.md §1–§4)
// ---------------------------------------------------------------------------

/** Nivel de triaje. Orden: '0' < '1' < '2'; 'A' queda fuera del orden (ids.md §1). */
                                            

                                                         

/** Archivos de config/ (05-diseno §2). */
                                                                                                   

/** P-* → valor. `sino` y `unica`: string; `multiple`: lista de valores. */
                                                           

/** D-* → texto (ids.md §3). Un campo ausente o en blanco cuenta como vacío. */
                                           

// ---------------------------------------------------------------------------
// Condiciones (05-diseno §3). Una respuesta se trata como conjunto de valores;
// una pregunta oculta o sin responder es el conjunto vacío.
// ---------------------------------------------------------------------------

                       
                                                                              
                                                                                           
                                                                                                 
                                                                                                 
                                                                                                     
                                                                                         
                                                                                     
                                                                                    
                                                                                    
                          
                           
                      

// ---------------------------------------------------------------------------
// config/cuestionario.yaml
// ---------------------------------------------------------------------------

/** Efecto de una opción. En `Opcion.efectos` se aplica el primero cuyo `si` se cumple. */
                         
                                                              
                  
                                         
                                          
                                          
                                                                                                                          
                                                                                             
 

                         
                                                                     
                   
                 
                                                                                      
                                                                                           
                                                                 
 

                           
                                        
                     
                
                 
                                                                                         
                                                                                                                    
                     
 

                         
                                                       
                 
                       
                        
 

/** Condición derivada de 02-triaje §2.1 y §4 (ids.md §4). Solo puede citar condiciones anteriores. */
                                    
             
                      
                                           
 

/** Efecto que no depende de una sola respuesta (02-triaje §4.1–§4.5). No cambia el nivel. */
                               
                                                                                   
                      
                    
                     
                          
                 
 

                                 
                                          
                                                                           
 

                        
              
                 
                  
                                           
 

                         
                                          
                
 

                            
                                        
                   
                 
                                                 
                                                                                                       
                                                              
                                                                                      
 

                               
                   
                     
                    
                                   
                                  
                    
 

// ---------------------------------------------------------------------------
// config/compromisos.yaml
// ---------------------------------------------------------------------------

/** Respuesta-tipo (fragmento) de una regla para un ítem o sección del F04. */
                                
                                                                                           
                
                                                                     
                                                                                                      
                                                                                                      
                                                                                         
 

/** Variante de una regla: reemplaza los campos que trae (03-compromisos §1). */
                                
                                                                                                             
                                                                                   
                      
                      
                               
 

                        
                                           
                 
                                                                                                  
                     
                                                              
                                                             
                              
 

                          
                                         
                 
                    
                                             
 

/** Textos para una regla que el IR declara que no puede cumplir (05-diseno §2.2; REQ-71, 72). */
                                   
                                                                         
                                                                              
                                                                                           
 

                              
                                                                                                           
                               
                                                       
 

// ---------------------------------------------------------------------------
// config/documentos.yaml
// ---------------------------------------------------------------------------

                                                                                                 

                           
                                          
                 
                                                                               
                                                             
 

                               
                                          
                 
                                             
                                                                                                              
 

                           
                
                                                              
                                                                                                  
 

                          
                                                                                                                 
                                                                                      
                                                                                   
                                                                                     
                                                                             
                      
 

                             
                                                                                       
                 
                                                                 
                   
 

                             
                                                 
                  
                
                                           
                                                                                           
 

                             
                                                   
                                                                                                               
                 
                          
 

                             
                                                                                
                             
                                                               
                                  
                                                                                                    
 

// ---------------------------------------------------------------------------
// config/ajustes.yaml (ids.md §10) y config/interfaz.yaml
// ---------------------------------------------------------------------------

                          
                  
                     
                            
                                    
                                                                                                     
                                                      
                                                                       
                      
                             
                                      
                      
                             
                                    
                                                                                             
 

/** Textos de la interfaz: clave → texto (05-diseno §7). */
                                              

                         
                             
                           
                         
                   
                     
 

/** YAML ya interpretado, aún sin validar. */
                                                                  

                              
                         
                                                                                 
                                                           
                                                        
 

                                 
                                
                                          

// ---------------------------------------------------------------------------
// Motor: evaluar(respuestas, config, datos) → Resultado (05-diseno §4)
// ---------------------------------------------------------------------------

/** Lo que ve una condición al evaluarse. Los campos opcionales solo existen en fases 2 y 3. */
                                    
                                                                                    
                                                                                
               
                  
                      
                    
 

                          
                                                         
                                                                                   
                                          // RP-X.n que el IR no acepta (05-diseno §4.1 paso 7 bis)

                         
                       
                
                  
                     
                   
                    
                         
 

                              
                                           
                  
                                                                      
                                                                                       
 

                            
                 
                                                                               
                                                           
                                                               
                                                                                            
                                       
                                                                  
                                                         
                                                               
                                                                      
                                                                  
                                                                             
                                                                  
                                                                                
                                                                                                                
                                                                                                            
 

// ---------------------------------------------------------------------------
// Composición de textos (05-diseno §5)
// ---------------------------------------------------------------------------

/** Texto con marcadores ya resueltos; «completar» = valor vacío o ítem que redacta el IR (REQ-37). */
                   
                                    
                                         
                                     

                                 
                 
                       
               
                                                                                                  
 

                                                                                            

                                
              
                    
                     
                                                                
                                                               
                                                   
                 
                                                        
                        
 

                                   
             
                 
                       
                         
 

                                 
             
                  
                 
                             
                     
 

// ---------------------------------------------------------------------------
// Salidas (05-diseno §8)
// ---------------------------------------------------------------------------

                          
                                                  
                 
                                          
                                                              
 

                         
               
                 
                                                                                             
                                                                          
                                                                                    
                                                                   
 

// ---------------------------------------------------------------------------
// Borrador (DOC-BORRADOR; 04-documentos §9, REQ-42 a REQ-47)
// ---------------------------------------------------------------------------

                           
                        
                                               
               
                         
                                                                                                     
 

                                 
                   
                    
                          
                       
                      
                       
                            

                                  
                                                                                 
                                                                

/** Subconjunto de Storage; permite probar con un almacenamiento simulado (REQ-42). */
                               
                                        
                                              
                                  
 
