---
title: 'The .NET ObjectDataSource and Me'
date: 2012-06-05T20:17:00.000-05:00
draft: false
url: /2012/06/net-objectdatasource-and-me.html
tags: 
- DotNet
- Development
- ObjectDataSource
---

I've recently decided that I'm a .NET developer. Then I got some people to pay me to be a .NET developer. All in all I'm happier writing code than I was fixing servers and networks but sometimes programming just drives me nuts. Today's rant is about the ObjectDataSource in .NET... and really datasource objects in general. I've recently started growing an application from typical 'GridView with SQLDataSource' to a big boy app with domain models, service contracts, and all kinds of other jazz I never worried about (or understood) when I was writing small time side projects for anybody interested in them. After happily generating loads and loads of back-end code to let the application be dll driven and capable of living inside services, web services, desktop apps, etc I go and return to some actual interface work! The Setup:  

So I update these two things to object data sources that properly declare GUIDs and Strings as what they are and this involves all kinds of relatively boring and unrelated things and this brand new ObjectDataSource:  

Everything looks good and compiles, and then my first obstacle on run-time happens.   
  
**System.InvalidCastException: Object must implement IConvertible. at System.Convert.ChangeType(Object value, TypeCode typeCode, IFormatProvider provider) **  
  
 What? Google takes me through pages and pages before finally explaining to me that because my datakey is a GUID and my select parameter is a string .NET won't be accepting this. There's nothing I can easily find in .NET land that lets me specify a 'ToString()' variety of anything... so I go back to my DataAccess class and write a new overload to deal with .NET being dumb.  
  
```
public static Warehouse WarehouseRetrieve(Guid guidID)
        {
            return WarehouseRetrieve(guidID.ToString());
        }

```  
Update SelectParameter in .aspx page:  

Compile and test and yes it works! Fantastic! Then I go to update my object and:  
  
** System.InvalidOperationException: ObjectDataSource 'odsWarehouse' could not find a non-generic method 'WarehouseUpdate' that takes parameters of type 'BusinessObjects.Warehouse' **  
  
 What do you mean? The method is there... the parameter is there. Your stupid wizard built it all out from the existing code, what do you mean you can't find it? So I look back at my DataAccess class for the website to see what could be the problem here:  
  
```
public static Warehouse WarehouseUpdate(Warehouse obj, String LogNote = "")
        {
            DataResult result = \_Service.WarehouseUpdate(obj, LogNote);
            if (result.wasSuccessful)
            {
                return result.ResultObject;
            }
            else
            {
                throw result.FullException;
            }
        } 
```  
And then I think... it's probably that optional parameter. I bet since I'm not setting it in the interface it's stripping it out and then complaining it can't find an appropriate overload. Lets see if there's something in the parameter options to stop this. Then I see this optional ConvertEmptyStringToNull option and set it.  

Yet still .net tosses me the same error :  
  
** System.InvalidOperationException: ObjectDataSource 'odsWarehouse' could not find a non-generic method 'WarehouseUpdate' that takes parameters of type 'BusinessObjects.Warehouse'**  
  
 So I go back to my DataAccess layer and write yet another overload.  
  
```
//ObjectDataSource controls are garbage and flip as of .net 4 on the object with optional LogNote parameter
//System.InvalidOperationException: ObjectDataSource 'odsWarehouse' could not find a non-generic method 'WarehouseUpdate' that takes parameters of type 'BusinessObjects.Warehouse'.
        public static Warehouse WarehouseUpdate(Warehouse obj)
        {
            return WarehouseUpdate(obj, null);
        }

```  
Successful update ensues.  
  
 Final acceptable ObjectDataSource:  

And then 2 overloads per object to accommodate it.  
  
What is the point of adding optional parameters in VB and C# if the .NET controls aren't going to actually use them? I have to now go and add these overloads to every single select and update in my data layer. Thanks for being such a useful and code reducing framework. Thanks for having such obscure error messages for these somewhat basic things too! The hours I spent reviewing others with this same problem and various solutions led me to start a blog and honor it with this as a first post in hopes somebody else may arrive at it and save them some time.