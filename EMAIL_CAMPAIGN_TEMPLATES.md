# Email Campaign Templates

## Email 1: Welcome Email (Day 0)

**Subject:** Welcome to Supply Chain Control Tower 🚀

**HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Supply Chain Control</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .checklist { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .checklist ul { list-style: none; padding: 0; }
        .checklist li { padding: 5px 0; }
        .checklist li::before { content: "✓ "; color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Supply Chain Control 🚀</h1>
            <p>Your 14-day free trial starts now!</p>
        </div>
        
        <div class="content">
            <p>Hi {{FIRST_NAME}},</p>
            
            <p>You're all set! Your 14-day free trial of Supply Chain Control starts now.</p>
            
            <div class="checklist">
                <h3>Here's what you can do right away:</h3>
                <ul>
                    <li>View real-time inventory across all locations</li>
                    <li>Track supplier performance and scorecards</li>
                    <li>Get AI-powered demand forecasts</li>
                    <li>Monitor shipments in transit</li>
                    <li>Access executive dashboards with KPIs</li>
                    <li>Create and manage purchase orders</li>
                </ul>
            </div>
            
            <h3>Quick Start Guide:</h3>
            <ol>
                <li><strong>Go to your dashboard</strong> - Explore the 6 main modules</li>
                <li><strong>Upload your inventory</strong> - Use our CSV template (we'll send this next)</li>
                <li><strong>Add your suppliers</strong> - Import supplier data or add manually</li>
                <li><strong>Set reorder points</strong> - We'll help optimize them automatically</li>
                <li><strong>Invite your team</strong> - Add colleagues for collaborative planning</li>
            </ol>
            
            <p><strong>Need help getting started?</strong></p>
            <ul>
                <li>📖 Check our <a href="{{HELP_DOCS_URL}}">help documentation</a></li>
                <li>📧 Reply to this email with questions</li>
                <li>📅 <a href="{{SCHEDULE_CALL_URL}}">Schedule a 15-min onboarding call</a></li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{DASHBOARD_URL}}" class="button">Go to Your Dashboard</a>
            </div>
            
            <p>Let's simplify your supply chain together!</p>
            
            <p>Best regards,<br>
            The Supply Chain Control Team</p>
        </div>
        
        <div class="footer">
            <p>Questions? Reply to this email or contact support@supplychain-control.com</p>
            <p>Supply Chain Control | Unified Supply Chain Platform</p>
        </div>
    </div>
</body>
</html>
```

**Plain Text Version:**

```
Hi {{FIRST_NAME}},

You're all set! Your 14-day free trial of Supply Chain Control starts now.

Here's what you can do right away:
✓ View real-time inventory across all locations
✓ Track supplier performance and scorecards  
✓ Get AI-powered demand forecasts
✓ Monitor shipments in transit
✓ Access executive dashboards with KPIs
✓ Create and manage purchase orders

QUICK START GUIDE:

1. Go to your dashboard - Explore the 6 main modules
2. Upload your inventory - Use our CSV template (we'll send this next)
3. Add your suppliers - Import supplier data or add manually
4. Set reorder points - We'll help optimize them automatically
5. Invite your team - Add colleagues for collaborative planning

Need help getting started?
- Check our help documentation: {{HELP_DOCS_URL}}
- Reply to this email with questions
- Schedule a 15-min onboarding call: {{SCHEDULE_CALL_URL}}

Go to your dashboard: {{DASHBOARD_URL}}

Let's simplify your supply chain together!

Best regards,
The Supply Chain Control Team

Questions? Reply to this email or contact support@supplychain-control.com
Supply Chain Control | Unified Supply Chain Platform
```

---

## Email 2: Payment Confirmation (After Payment)

**Subject:** Payment confirmed - Invoice attached 📋

**HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .plan-features { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmed! 🎉</h1>
            <p>Welcome to {{PLAN_NAME}}</p>
        </div>
        
        <div class="content">
            <p>Hi {{FIRST_NAME}},</p>
            
            <p>Thanks for upgrading to <strong>{{PLAN_NAME}}</strong>! Your payment has been processed successfully.</p>
            
            <div class="details">
                <h3>Order Details:</h3>
                <p><strong>Plan:</strong> {{PLAN_NAME}}</p>
                <p><strong>Amount:</strong> ${{AMOUNT}}/month</p>
                <p><strong>Billing Date:</strong> {{BILLING_DATE}} (monthly)</p>
                <p><strong>Next Billing:</strong> {{NEXT_BILLING_DATE}}</p>
                <p><strong>Invoice:</strong> <a href="{{INVOICE_URL}}">Download PDF</a></p>
            </div>
            
            <div class="plan-features">
                <h3>Your {{PLAN_NAME}} plan includes:</h3>
                <ul>
                    {{#ifEquals PLAN_NAME "Starter"}}
                    <li>✓ Up to 1,000 SKUs</li>
                    <li>✓ 5 locations</li>
                    <li>✓ Basic analytics</li>
                    <li>✓ Email support</li>
                    {{/ifEquals}}
                    
                    {{#ifEquals PLAN_NAME "Growth"}}
                    <li>✓ Unlimited SKUs and locations</li>
                    <li>✓ Advanced analytics</li>
                    <li>✓ Priority support</li>
                    <li>✓ API access</li>
                    <li>✓ Custom reports</li>
                    {{/ifEquals}}
                    
                    {{#ifEquals PLAN_NAME "Enterprise"}}
                    <li>✓ Everything in Growth</li>
                    <li>✓ White-label options</li>
                    <li>✓ Custom integrations</li>
                    <li>✓ Dedicated support manager</li>
                    <li>✓ SLA guarantees</li>
                    {{/ifEquals}}
                </ul>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
                <li><strong>Explore your dashboard</strong> - Take a full tour of your new features</li>
                <li><strong>Set up integrations</strong> - Connect your ERP, accounting, or e-commerce systems</li>
                <li><strong>Invite your team</strong> - Add colleagues to maximize platform value</li>
                <li><strong>Schedule onboarding</strong> - Get personalized training for your use case</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{DASHBOARD_URL}}" class="button">Access Your Dashboard</a>
            </div>
            
            <h3>Need Help?</h3>
            <ul>
                <li>📧 <strong>Email:</strong> support@supplychain-control.com</li>
                <li>📞 <strong>Phone:</strong> 1-800-SUPPLY (available for Growth & Enterprise)</li>
                <li>📅 <strong>Schedule training:</strong> <a href="{{TRAINING_URL}}">Book your onboarding call</a></li>
            </ul>
            
            <p>Welcome to the future of supply chain management!</p>
            
            <p>Best regards,<br>
            The Supply Chain Control Team</p>
        </div>
        
        <div class="footer">
            <p>Manage your subscription: <a href="{{SUBSCRIPTION_URL}}">Account Settings</a></p>
            <p>Questions? Contact support@supplychain-control.com</p>
            <p>Supply Chain Control | Unified Supply Chain Platform</p>
        </div>
    </div>
</body>
</html>
```

---

## Email 3: Trial Reminder (7 Days Before End)

**Subject:** Your free trial ends in 7 days ⏰

**HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trial Ending Soon</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .urgency { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
        .benefits { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Trial Ending Soon</h1>
            <p>7 days left to continue your supply chain success</p>
        </div>
        
        <div class="content">
            <p>Hi {{FIRST_NAME}},</p>
            
            <div class="urgency">
                <p><strong>Your 14-day free trial ends in 7 days ({{TRIAL_END_DATE}}).</strong></p>
                <p>Ready to continue unlocking your supply chain's potential?</p>
            </div>
            
            <h3>Here's what you've accomplished this week:</h3>
            <div class="benefits">
                <ul>
                    <li>📊 {{STATS_SKUS_TRACKED}} SKUs tracked across {{STATS_LOCATIONS}} locations</li>
                    <li>🚨 {{STATS_ALERTS_PREVENTED}} potential stockouts identified and prevented</li>
                    <li>📈 {{STATS_SUPPLIERS_REVIEWED}} supplier scorecards analyzed</li>
                    <li>📋 {{STATS_POS_CREATED}} purchase orders created with optimized timing</li>
                    <li>⏱️ {{STATS_TIME_SAVED}} hours saved from manual data entry</li>
                </ul>
            </div>
            
            <h3>Keep the momentum going with these benefits:</h3>
            <ul>
                <li><strong>Prevent Stockouts:</strong> Automated alerts when inventory drops below reorder points</li>
                <li><strong>Optimize Inventory:</strong> AI-powered recommendations to reduce carrying costs</li>
                <li><strong>Improve Supplier Performance:</strong> Track and improve delivery times and quality</li>
                <li><strong>Make Faster Decisions:</strong> Real-time dashboards replace 2-3 day lag times</li>
                <li><strong>Reduce Costs:</strong> Consolidation eliminates redundant software licenses</li>
            </ul>
            
            <h3>Simple Upgrade Process:</h3>
            <ol>
                <li>Choose your plan: <strong>Starter ($699/mo)</strong> or <strong>Growth ($1,999/mo)</strong></li>
                <li>No setup fees or long-term contracts</li>
                <li>Keep all your data and configurations</li>
                <li>Continue seamlessly with no downtime</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{UPGRADE_URL}}" class="button">Upgrade Now - Start Saving</a>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h4>💰 Cost Comparison:</h4>
                <p><strong>Your current setup:</strong> ${{CURRENT_MONTHLY_COST}}/month</p>
                <p><strong>Supply Chain Control Growth:</strong> $1,999/month</p>
                <p><strong>Monthly savings:</strong> ${{MONTHLY_SAVINGS}} (That's {{ANNUAL_SAVINGS}} per year!)</p>
            </div>
            
            <p><strong>Have questions or want to discuss your specific needs?</strong></p>
            <ul>
                <li>📧 Reply to this email - I'd love to hear about your experience</li>
                <li>📅 <a href="{{SCHEDULE_CALL_URL}}">Schedule a call</a> to discuss your upgrade</li>
                <li>📞 Call us: 1-800-SUPPLY</li>
            </ul>
            
            <p>Don't lose the progress you've made this week. Your supply chain is already running smoother—let's keep it that way!</p>
            
            <p>Best regards,<br>
            {{ACCOUNT_MANAGER_NAME}}<br>
            Customer Success Manager</p>
        </div>
        
        <div class="footer">
            <p>Questions? Reply to this email or contact support@supplychain-control.com</p>
            <p>Supply Chain Control | Unified Supply Chain Platform</p>
        </div>
    </div>
</body>
</html>
```

---

## Email 4: Onboarding - Day 3

**Subject:** Pro tip: Import your inventory in 2 minutes ⚡

**HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quick Inventory Import Tip</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .tip { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
        .steps { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .steps ol { padding-left: 20px; }
        .csv-preview { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Quick Import Tip</h1>
            <p>Get your inventory data loaded in 2 minutes</p>
        </div>
        
        <div class="content">
            <p>Hi {{FIRST_NAME}},</p>
            
            <p>Welcome to day 3 of your trial! By now you've probably explored the dashboard and seen the platform's capabilities.</p>
            
            <div class="tip">
                <h3>🚀 Pro Tip: The fastest way to see value is to load your inventory data.</h3>
                <p>Most users see their biggest "wow moments" once they import their actual inventory and see real-time insights.</p>
            </div>
            
            <h3>Quick Inventory Import (2 minutes):</h3>
            
            <div class="steps">
                <ol>
                    <li><strong>Download our CSV template:</strong> <a href="{{CSV_TEMPLATE_URL}}">Inventory Import Template</a></li>
                    <li><strong>Add your SKUs:</strong> Copy your inventory data into the template (we support 100+ fields)</li>
                    <li><strong>Upload to the platform:</strong> Go to Inventory → Import → Upload your CSV</li>
                    <li><strong>Review and confirm:</strong> We'll validate your data and suggest optimizations</li>
                    <li><strong>Start seeing insights:</strong> Your dashboard updates immediately with real data</li>
                </ol>
            </div>
            
            <h3>CSV Template Preview:</h3>
            <div class="csv-preview">
sku,product_name,location,quantity,reorder_point,safety_stock,unit_cost,supplier_name
SKU001,Widget A,Main Warehouse,150,50,25,12.50,Acme Corp
SKU002,Widget B,Store #1,75,30,15,8.75,Global Supplies
SKU003,Component C,Distribution Center,300,100,50,3.25,Manufacturing Inc
            </div>
            
            <h3>Data We Support:</h3>
            <ul>
                <li>✓ <strong>Basic:</strong> SKU, Product Name, Location, Quantity</li>
                <li>✓ <strong>Planning:</strong> Reorder Points, Safety Stock, Lead Times</li>
                <li>✓ <strong>Financial:</strong> Unit Cost, Total Value, Budgets</li>
                <li>✓ <strong>Supplier:</strong> Supplier Names, Contact Info, Payment Terms</li>
                <li>✓ <strong>Advanced:</strong> Categories, Tags, Custom Fields</li>
            </ul>
            
            <h3>Common Import Sources:</h3>
            <p>We support imports from virtually any system:</p>
            <ul>
                <li>SAP, Oracle, NetSuite (ERP systems)</li>
                <li>Excel, Google Sheets (manual tracking)</li>
                <li>QuickBooks, Xero (accounting systems)</li>
                <li>Shopify, Amazon, WooCommerce (e-commerce)</li>
                <li>CSV exports from any other system</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{IMPORT_GUIDE_URL}}" class="button">View Step-by-Step Guide</a>
                <a href="{{DOWNLOAD_TEMPLATE_URL}}" class="button" style="background: #10b981;">Download CSV Template</a>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h4>🎯 What happens after import?</h4>
                <ul>
                    <li><strong>Instant Insights:</strong> See inventory health across all locations</li>
                    <li><strong>Reorder Alerts:</strong> Get notified about low stock items</li>
                    <li><strong>Supplier Analysis:</strong> Identify your best and worst performers</li>
                    <li><strong>Cost Optimization:</strong> See where you're over/under-stocked</li>
                    <li><strong>Dashboard Updates:</strong> All widgets populate with your real data</li>
                </ul>
            </div>
            
            <p><strong>Need help with your import?</strong></p>
            <ul>
                <li>📧 Reply to this email with questions</li>
                <li>📅 <a href="{{SCHEDULE_HELP_URL}}">Book a 10-min help session</a></li>
                <li>📖 <a href="{{IMPORT_HELP_URL}}">Read our import guide</a></li>
            </ul>
            
            <p>Once you've imported your inventory, you'll see why companies are switching from 5+ tools to one unified platform!</p>
            
            <p>Best regards,<br>
            {{ONBOARDING_SPECIALIST_NAME}}<br>
            Onboarding Specialist</p>
        </div>
        
        <div class="footer">
            <p>Questions? Reply to this email or contact support@supplychain-control.com</p>
            <p>Supply Chain Control | Unified Supply Chain Platform</p>
        </div>
    </div>
</body>
</html>
```

---

## Email 5: Value Recap (Day 7)

**Subject:** You've saved 4 hours this week 💪

**HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Week 1 Success Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .success { background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #10b981; }
        .metric-label { color: #6b7280; font-size: 0.9em; }
        .testimonial { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Week 1 Success!</h1>
            <p>Here's what you accomplished in your first week</p>
        </div>
        
        <div class="content">
            <p>Hi {{FIRST_NAME}},</p>
            
            <div class="success">
                <h2>Congratulations! Your first week with Supply Chain Control has been a success! 🎯</h2>
                <p>Here's a summary of what your team accomplished in just 7 days:</p>
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">{{STATS_SKUS_TRACKED}}</div>
                    <div class="metric-label">SKUs Now Tracked</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{{STATS_LOCATIONS}}</div>
                    <div class="metric-label">Locations Unified</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{{STATS_ALERTS_PREVENTED}}</div>
                    <div class="metric-label">Stockouts Prevented</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{{STATS_TIME_SAVED}}</div>
                    <div class="metric-label">Hours Saved</div>
                </div>
            </div>
            
            <h3>Key Achievements This Week:</h3>
            <ul>
                <li>✅ <strong>Inventory Visibility:</strong> Gained real-time view across all {{STATS_LOCATIONS}} locations</li>
                <li>✅ <strong>Supplier Insights:</strong> Analyzed performance of {{STATS_SUPPLIERS_ANALYZED}} suppliers</li>
                <li>✅ <strong>Demand Planning:</strong> Set up 12-month forecasts with {{STATS_ACCURACY}}% accuracy</li>
                <li>✅ <strong>Purchase Orders:</strong> Created {{STATS_POS_OPTIMIZED}} optimized POs</li>
                <li>✅ <strong>Time Savings:</strong> Eliminated {{STATS_TIME_SAVED}} hours of manual data entry</li>
                <li>✅ <strong>Cost Reduction:</strong> Identified ${{STATS_COST_SAVINGS}} in potential savings</li>
            </ul>
            
            <h3>What Our Customers Say:</h3>
            <div class="testimonial">
                <p><em>"Within the first week, we identified $50K in excess inventory and prevented 3 stockouts that would have cost us $25K in expedite fees. The ROI was immediate."</em></p>
                <p><strong>- Sarah M., VP Operations, Manufacturing Company</strong></p>
            </div>
            
            <h3>Real Impact on Your Business:</h3>
            <ul>
                <li><strong>Prevented Revenue Loss:</strong> ${{REVENUE_LOSS_PREVENTED}} in potential lost sales from avoided stockouts</li>
                <li><strong>Optimized Cash Flow:</strong> ${{CASH_FLOW_OPTIMIZED}} freed up from inventory optimization</li>
                <li><strong>Reduced Risk:</strong> {{RISK_EVENTS_PREVENTED}} supply chain disruptions identified and mitigated</li>
                <li><strong>Improved Planning:</strong> {{PLANNING_ACCURACY}}% improvement in demand forecast accuracy</li>
            </ul>
            
            <h3>Your Supply Chain Is Already Running Smoother</h3>
            <p>In just one week, you've consolidated what typically takes months of manual work:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f3f4f6;">
                    <th style="padding: 10px; text-align: left;">Activity</th>
                    <th style="padding: 10px; text-align: center;">Before (Manual)</th>
                    <th style="padding: 10px; text-align: center;">After (Automated)</th>
                    <th style="padding: 10px; text-align: center;">Time Saved</th>
                </tr>
                <tr>
                    <td style="padding: 10px;">Inventory Reporting</td>
                    <td style="padding: 10px; text-align: center;">2-3 hours daily</td>
                    <td style="padding: 10px; text-align: center;">Real-time</td>
                    <td style="padding: 10px; text-align: center; color: #10b981;">10-15 hours/week</td>
                </tr>
                <tr style="background: #f9fafb;">
                    <td style="padding: 10px;">Supplier Scorecards</td>
                    <td style="padding: 10px; text-align: center;">1 day per month</td>
                    <td style="padding: 10px; text-align: center;">Automated</td>
                    <td style="padding: 10px; text-align: center; color: #10b981;">8-12 hours/month</td>
                </tr>
                <tr>
                    <td style="padding: 10px;">Demand Planning</td>
                    <td style="padding: 10px; text-align: center;">3-4 days per cycle</td>
                    <td style="padding: 10px; text-align: center;">1-2 hours</td>
                    <td style="padding: 10px; text-align: center; color: #10b981;">24-32 hours/cycle</td>
                </tr>
            </table>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h4>🚀 Keep the momentum going!</h4>
                <p>You're already seeing results. Ready to unlock even more value with advanced features?</p>
                <ul>
                    <li>Advanced analytics and custom reports</li>
                    <li>API integrations with your ERP system</li>
                    <li>White-label options for customer-facing operations</li>
                    <li>Dedicated customer success manager</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{UPGRADE_URL}}" class="button">Upgrade to Unlock Advanced Features</a>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
                <li><strong>Week 2:</strong> Set up automated reorder workflows and supplier scorecards</li>
                <li><strong>Week 3:</strong> Integrate with your ERP for seamless data flow</li>
                <li><strong>Week 4:</strong> Launch advanced analytics and executive dashboards</li>
            </ul>
            
            <p><strong>Questions about your progress or want to discuss upgrading?</strong></p>
            <ul>
                <li>📧 Reply to this email - I love hearing about your success!</li>
                <li>📅 <a href="{{SCHEDULE_REVIEW_URL}}">Schedule a 15-min progress review</a></li>
                <li>💬 <a href="{{JOIN_COMMUNITY_URL}}">Join our user community</a> to connect with other users</li>
            </ul>
            
            <p>You've proven that unified supply chain management delivers results. Let's keep building on this success!</p>
            
            <p>Best regards,<br>
            {{SUCCESS_MANAGER_NAME}}<br>
            Customer Success Manager</p>
        </div>
        
        <div class="footer">
            <p>Keep up the great work! Questions? Reply to this email or contact support@supplychain-control.com</p>
            <p>Supply Chain Control | Unified Supply Chain Platform</p>
        </div>
    </div>
</body>
</html>
```

---

## Usage Instructions

### Variable Replacement
Replace these variables with actual data:
- `{{FIRST_NAME}}` - User's first name
- `{{PLAN_NAME}}` - Selected subscription plan
- `{{AMOUNT}}` - Monthly amount
- `{{BILLING_DATE}}` - Billing date
- `{{NEXT_BILLING_DATE}}` - Next billing date
- `{{DASHBOARD_URL}}` - Link to user's dashboard
- `{{UPGRADE_URL}}` - Link to upgrade page
- `{{CSV_TEMPLATE_URL}}` - Download link for CSV template
- `{{STATS_SKUS_TRACKED}}` - Number of SKUs tracked
- `{{STATS_LOCATIONS}}` - Number of locations
- `{{STATS_ALERTS_PREVENTED}}` - Number of alerts prevented
- `{{STATS_TIME_SAVED}}` - Hours saved
- `{{REVENUE_LOSS_PREVENTED}}` - Revenue loss prevented
- `{{CASH_FLOW_OPTIMIZED}}` - Cash flow optimization amount

### SendGrid Integration
- Configure SendGrid API key in environment variables
- Set up dynamic templates with SendGrid
- Use SendGrid's personalization features for variable replacement
- Set up event tracking for opens, clicks, and conversions

### A/B Testing
Test different subject lines and content variations:
- Subject lines: Question vs. Statement formats
- CTA buttons: "Start Trial" vs. "Get Started" vs. "Try Free"
- Urgency levels: High urgency vs. soft approach
- Personalization: Generic vs. personalized content